import fs from 'fs';
import {globby} from 'globby';
import moment from 'moment';
import { parseArgsStringToArgv } from 'string-argv';
import { spawn } from 'cross-spawn';
import clc from 'cli-color';
import { paranoidSleep } from './helpers.mjs';


export class DiscordExportWritter {
    constructor(guildId, discordApi, isDryRun, shouldCheckAll) {
        this.guildId = guildId;
        this.discordApi = discordApi;
        this.token = discordApi.getToken();
        this.isDryRun = isDryRun;
        this.shouldCheckAll = shouldCheckAll;
    }

    getBlacklistedLastMessageIds() {
        let blacklistedIds = [];
        if (fs.existsSync(`cache/blacklisted_ids.json`)) {
            blacklistedIds = JSON.parse(fs.readFileSync(`cache/blacklisted_ids.json`));
        }
        return blacklistedIds
    }

    markAsBlacklisted(lastMessageId) {
        let blacklistedIds = this.getBlacklistedLastMessageIds();
        blacklistedIds.push(lastMessageId);
        // deduplicate
        blacklistedIds = [...new Set(blacklistedIds)];
        fs.writeFileSync(`cache/blacklisted_ids.json`, JSON.stringify(blacklistedIds, null, 4));
    }


    async execCommand(command, channelLastMessageId) {
        // command = 'ping 1.1.1.1'   // DEBUG
        const commandRedacted = command.replace(/--token [-A-Za-z0-9+\/=\._]+/, '--token <REDACTED>');

        if (!fs.existsSync('cache/logs')) {
            fs.mkdirSync('cache/logs', { recursive: true });
        }
        fs.appendFileSync('cache/logs/commands.txt', commandRedacted + "\n");

        if (!this.isDryRun) {
            // regex replace token

            console.log(clc.blackBright(commandRedacted));
            // console.log('NOT DRY RUN');
            let cmd_args = parseArgsStringToArgv(command);
            let cmd = cmd_args.shift();
            var child = spawn.sync(cmd, cmd_args, { stdio: 'inherit' });
            if(child.error) {
                console.log("ERROR: ",child.error);
                process.exit(1);
            }

            // Mark as downloaded, becase sometimes the download is false positive and we don't want to download it again and again.
            this.markAsBlacklisted(channelLastMessageId);

            await paranoidSleep()
        }
        else {
            console.log(clc.blackBright(commandRedacted));
        }
    }

    async downloadChannelOrThread(channel, ignoreChannelIds, lastMessageIds, OUTPUT_FOLDER) {


        let channelTypeDebug = clc.blue("channel")
        if (channel.type === 11) {
            channelTypeDebug = clc.magenta("thread")
        }

        // verify if channel_id is numeric to avoid command injection
        if (!/^\d+$/.test(channel.id)) {
            console.log(channelTypeDebug, clc.red('ID'), channel.id, clc.red('ID IS NOT NUMERIC, SKIPPING DOWNLOAD'));
            return;
        }

        if (ignoreChannelIds.includes(channel.id)) {
            console.log(`Ignoring ${channelTypeDebug} ${clc.yellow(channel.name)}, because it was already downloaded`);
            return ignoreChannelIds
        }
        if (channel.last_message_id === null) {
            console.log(`No messages in ${channelTypeDebug} ${clc.yellow(channel.name)}`);
            return ignoreChannelIds
        }
        if (this.getBlacklistedLastMessageIds().includes(channel.last_message_id)) {
            console.log(`${channelTypeDebug} ${clc.yellow(channel.name)} ${clc.red('has new messages, but it\'s probably false positive, skipping.')}`);  // Delete cache/blacklisted_ids.json to force download.
            return ignoreChannelIds
        }
        else if (!lastMessageIds[channel.id]) {
            console.log(`${clc.green('New')} ${channelTypeDebug} ${clc.yellow(channel.name)} with messages`, );
            await this.execCommand(`DiscordChatExporter.Cli export --token ${this.token} --format Json --media --reuse-media --fuck-russia --channel ${channel.id} --output ${OUTPUT_FOLDER}`, channel.last_message_id);
            ignoreChannelIds.push(channel.id);
        }
        else if (BigInt(lastMessageIds[channel.id]['id']) >= BigInt(channel.last_message_id)) {
            console.log(`${channelTypeDebug} ${clc.yellow(channel.name)} is already up to date`);
            if (!this.shouldCheckAll) {  // check all channels for updated threads, not just the ones with new messages?
                return ignoreChannelIds
            }
        }
        else {
            console.log(`${clc.green('More messages')} found in ${channelTypeDebug} ${clc.yellow(channel.name)}`);  // sometimes is false positive if the last message was deleted
            await this.execCommand(`DiscordChatExporter.Cli export --token ${this.token} --format Json --media --reuse-media --fuck-russia --channel ${channel.id} --after ${moment(lastMessageIds[channel.id]['timestamp']).utcOffset(0).add(1, 'seconds').format()} --output ${OUTPUT_FOLDER}`, channel.last_message_id);
            ignoreChannelIds.push(channel.id);
        }
        if (channel.type === 0 || channel.type === 15) {  // 0=threads, 15=forums
            // download threads/forums
            const threads = await this.discordApi.getThreads(this.guildId, channel.id);
            for (const thread of threads) {
                ignoreChannelIds = await this.downloadChannelOrThread(thread, ignoreChannelIds, lastMessageIds, OUTPUT_FOLDER + '_threads/');
            }
        }
        return ignoreChannelIds
    }

    async saveChannelThreadInfo(guildCacheFolder, savePathFolder) {
        // read channels.json
        const channelsJson = JSON.parse(fs.readFileSync(`${guildCacheFolder}/channels.json`));

        // read all jsons in threads folder
        const threadFiles = await globby(`${guildCacheFolder}/threads/**/*.json`);
        let threads = [];
        for (const threadFile of threadFiles) {
            const threadJson = JSON.parse(fs.readFileSync(threadFile));
            threads = threads.concat(threadJson.threads);
        }

        // save channel info
        const channelInfo = {
            "channels": channelsJson,
            "threads": threads,
            "timestamp": moment().utcOffset(0).format(),
            "type": "channelThreadInfo",
            "guildId": this.guildId
        }
        // crerate folder if not exists
        if (!fs.existsSync(savePathFolder)) {
            fs.mkdirSync(savePathFolder, { recursive: true });
        }
        fs.writeFileSync(`${savePathFolder}/channel_info.json`, JSON.stringify(channelInfo, null, 4));
    }
}