import fs from 'fs';
import {globby} from 'globby';
import clc from 'cli-color';


export class DiscordExportReader {
    constructor(path) {
        this.path = path;
    }

    async findAllJsonFiles() {
        console.log("Finding all json files in", this.path);
        const files = await globby(`${this.path}/**/*.json`);
        return files;
    }


    async findLastMessageIds(guildId) {
        // read all json files
        const files = await this.findAllJsonFiles();
        console.log("Found", files.length, "files");
        const lastMessageIds = {};  // key is channel id, value is last message id
        console.log("Reading json files...");
        for (const file of files) {
            // console.log("Reading file", file);
            try {
                const json = JSON.parse(fs.readFileSync(file))
                const channelId = json.channel.id;
                for (const message of json.messages) {
                    if (!lastMessageIds[channelId] || BigInt(message.id) > BigInt(lastMessageIds[channelId]['id'])) {
                        lastMessageIds[channelId] = {
                            "id": message.id,
                            "timestamp": message.timestamp
                        };
                    }
                }
            }
            catch (e) {
                console.error("Invalid export file", file);
            }
        }
        return lastMessageIds;
    }
}
