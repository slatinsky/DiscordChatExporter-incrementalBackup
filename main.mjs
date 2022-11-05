import minimist from 'minimist';
import crypto from 'crypto';
import clc from 'cli-color';


import { DiscordApi } from './DiscordApi.mjs';
import { DiscordExportReader } from './DiscordExportReader.mjs';
import { DiscordExportWritter } from './DiscordExportWritter.mjs';




const args = minimist(process.argv.slice(2), {
    string: ['token', 'guild', 'output'],
    boolean: ['help', 'dryrun'],
    alias: {
        t: 'token',
        g: 'guild'
    },
    default: {
        help: false,
        dryrun: false,
        token: '',
        guild: '',
        output: ''
    }
});
console.log("args", args);
// process.exit(1);

if (args.help) {
    console.error('## Discord export helper ##')
    console.log('Available commands:');
    console.log('  channels --token <token1> [--token <token2> ...] --guild <guildId> --output "<export_folder_path>"');
    console.log('  add --dryrun to only print the commands to be executed');
    console.log('  add --checkall to check all channels for updated threads, not just the ones with new messages');
    process.exit(1);
}

// check if token is provided
if (args.token === '') {
    console.error('No token provided, use --token "<token>"');
    process.exit(1);
}

// PREPROCESS ARGS
// if args.token is not an array, make it one
if (!Array.isArray(args.token)) {
    args.token = [args.token];
}
args.output = args.output.replace(/\\/g, "/")

for (const token of args.token) {
    // verify token has correct format
    if (!/^[-A-Za-z0-9+\/=\._]+$/.test(token)) {
        console.log(clc.red('TOKEN'), token, clc.red('LOOKS INVALID, EXITING'));
        process.exit(1);
    }
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex').slice(0, 10)
}


async function exportChannels(token, ignoreChannelIds, lastMessageIds) {
    // hash token to get a unique folder for each user
    const hashedToken = hashToken(token)
    const dateString = new Date().toISOString().slice(0, 10);  //yyyy_mm_dd
    // const dateString = new Date().toISOString().slice(0, 19).replace(/:/g, '-');  // yyyy_mm_dd_hh_mm_ss
    const CACHE_FOLDER = `cache/${dateString}/`;
    const CACHE_FOLDER_NO_DATE = `cache/`;


    // if OUTPUT_FOLDER does not exist, create it
    // if (fs.existsSync(OUTPUT_FOLDER)) {
    //     console.log("Today's backup was already done for this token, aborting");
    //     return ignoreChannelIds
    // }
    const discordApi = new DiscordApi(token, CACHE_FOLDER, hashedToken);

    const allowedChannels = await discordApi.getAllowedChannels(args.guild);
    const userName = (await discordApi.getUserProfile()).username;
    const safeUserName = userName.replace(/[^a-zA-Z0-9]/gi, '')

    const OUTPUT_FOLDER = args.output + "/automated/" + args.guild + "/" + safeUserName + "/" + dateString + "/";

    // const metadataJson = JSON.parse(fs.readFileSync(`${CACHE_FOLDER_NO_DATE}/crawl.json`));

    console.log(`Logged in as ${clc.green(userName)}`);
    // const commands = []

    const discordWritter = new DiscordExportWritter(args.guild, discordApi, args.dryrun, args.checkall);
    for (const channel of allowedChannels) {
        ignoreChannelIds = await discordWritter.downloadChannelOrThread(channel, ignoreChannelIds, lastMessageIds, OUTPUT_FOLDER)
    }

    await discordWritter.saveChannelThreadInfo(CACHE_FOLDER + "/guilds/" + args.guild + "/", OUTPUT_FOLDER);
    return ignoreChannelIds;
}

if (args._.includes('channels')) {
    if (args.guild === '') {
        console.error('No guild provided, use --guild "<guildId>"');
    }
    if (args.output === '') {
        console.error('No exports folder provided, use --output "<export_folder_path>"');
    }
    else {
        const INPUT_FOLDER = args.output
        const discordExport = new DiscordExportReader(INPUT_FOLDER);
        const lastMessageIds = await discordExport.findLastMessageIds()

        let ignoreChannelIds = [];
        for (const token of args.token) {
            console.log("\n\n\n\n\n");
            ignoreChannelIds = await exportChannels(token, ignoreChannelIds, lastMessageIds);
        }
    }
}
else {
    console.error('Unknown command:', args._[0]);
}