import fs from 'fs';
import {globby} from 'globby';
import moment from 'moment';
import { parseArgsStringToArgv } from 'string-argv';
import { spawn } from 'cross-spawn';
import clc from 'cli-color';
import { paranoidSleep } from './helpers.mjs';


export class DiscordExportWritter {
    constructor(guildId, isDryRun, shouldCheckAll) {
        this.guildId = guildId;
        this.isDryRun = isDryRun;
        this.shouldCheckAll = shouldCheckAll;
    }


    async execCommand(command) {
        // command = 'ping 1.1.1.1'   // DEBUG

        if (!this.isDryRun) {
            console.log(command);
            // console.log('NOT DRY RUN');
            let cmd_args = parseArgsStringToArgv(command);
            let cmd = cmd_args.shift();
            var child = spawn.sync(cmd, cmd_args, { stdio: 'inherit' });
            if(child.error) {
                console.log("ERROR: ",child.error);
                // process.exit(1);
            }
            await paranoidSleep()
        }
        else {
            console.log(command);
        }

    }

    async downloadChannelOrThread(channel, ignoreChannelIds, lastMessageIds, token, OUTPUT_FOLDER, discord) {
        let channelTypeDebug = clc.blue("channel")
        if (channel.type === 11) {
            channelTypeDebug = clc.magenta("thread")
        }
        if (ignoreChannelIds.includes(channel.id)) {
            console.log(`Ignoring ${channelTypeDebug} ${clc.yellow(channel.name)}, because it was already downloaded`);
            return ignoreChannelIds
        }
        if (channel.last_message_id === null) {
            console.log(`No messages in ${channelTypeDebug} ${clc.yellow(channel.name)}`);
            return ignoreChannelIds
        }
        else if (!lastMessageIds[channel.id]) {
            console.log(`${clc.green('New')} ${channelTypeDebug} ${clc.yellow(channel.name)} with messages`, );
            // TODO: FIX POSSIBLE COMMAND INJECTION
            await this.execCommand(`DiscordChatExporter.Cli export --token ${token} --format Json --media --reuse-media --channel ${channel.id} --output ${OUTPUT_FOLDER}`);
            ignoreChannelIds.push(channel.id);
        }
        else if (lastMessageIds[channel.id]['id'] === channel.last_message_id) {
            console.log(`${channelTypeDebug} ${clc.yellow(channel.name)} is already up to date`);
            if (!this.shouldCheckAll) {  // check all channels for updated threads, not just the ones with new messages?
                return ignoreChannelIds
            }
        }
        else {
            console.log(`${clc.green('More messages')} found in ${channelTypeDebug} ${clc.yellow(channel.name)}`);  // sometimes is false positive if the last message was deleted
            // TODO: FIX POSSIBLE COMMAND INJECTION
            await this.execCommand(`DiscordChatExporter.Cli export --token ${token} --format Json --media --reuse-media --channel ${channel.id} --after ${moment(lastMessageIds[channel.id]['timestamp']).utcOffset(0).add(1, 'seconds').format()} --output ${OUTPUT_FOLDER}`);
            ignoreChannelIds.push(channel.id);
        }
        if (channel.type === 0 || channel.type === 15) {  // 0=threads, 15=forums
            // download threads/forums
            const threads = await discord.getThreads(this.guildId, channel.id);
            for (const thread of threads) {
                ignoreChannelIds = await this.downloadChannelOrThread(thread, ignoreChannelIds, lastMessageIds, token, OUTPUT_FOLDER + '_threads/', discord);
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
            threads.push(threadJson.threads);
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