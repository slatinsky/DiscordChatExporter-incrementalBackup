import fetch from 'node-fetch';
import fs from 'fs';
import https from 'node:https';
import { paranoidSleep } from './helpers.mjs';



export class DiscordApi {
    constructor(token, CACHE_FOLDER, hashedToken) {
        this.agent = new https.Agent({ keepAlive: true });
        this.token = token;
        this.CACHE_FOLDER = CACHE_FOLDER;
        this.hashedToken = hashedToken;
    }

    getToken() {
        return this.token;
    }

    async saveToFile(fileName, json) {
        fs.writeFileSync(this.CACHE_FOLDER + fileName, JSON.stringify(json, null, 2));
    }


    async discordFetch(endpoint, fileName) {
        const folder = this.CACHE_FOLDER + fileName.split('/').slice(0, -1).join('/');
        fs.mkdirSync(folder, { recursive: true });
        if (fs.existsSync(this.CACHE_FOLDER + fileName)) {
            console.log("Using cache", `/api/v9/${endpoint}`);
            return JSON.parse(fs.readFileSync(this.CACHE_FOLDER + fileName));
        }
        console.log(`Requesting /v9/${endpoint}`);

        let agent = this.agent;
        let token = this.token;

        const response = await fetch(`https://discord.com/api/v9/${endpoint}`, {
            "credentials": "include",
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": token,
                "sec-ch-ua": "\"Chromium\";v=\"106\", \"Google Chrome\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-debug-options": "bugReporterEnabled",
                "x-discord-locale": "en-GB",
                "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEwNi4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTA2LjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL3d3dy5nb29nbGUuY29tLyIsInJlZmVycmluZ19kb21haW4iOiJ3d3cuZ29vZ2xlLmNvbSIsInNlYXJjaF9lbmdpbmUiOiJnb29nbGUiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTUzNjU1LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
                "Referer": "https://discord.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "referrer": "https://discord.com/",
            "method": "GET",
            "mode": "cors",
            agent
        });

        const json = await response.json();

        if (response.status === 429) {
            console.log("Rate limited (429: Retry after", json.retry_after, "s)");
            await new Promise(r => setTimeout(r, (json.retry_after + 1) * 1156));
            return this.discordFetch(endpoint, fileName);
        }
        if (json.message) {
            console.error("Error:", json.message, json.code, endpoint);
            // panic mode - kill the app on api error
            process.exit(1);
        }


        await paranoidSleep()

        // save to file
        this.saveToFile(fileName, json);

        return json;
    }

    async getGuild(guildId) {
        const fileName = `guilds/${guildId}/guild.json`
        const guildInfo = await this.discordFetch(`guilds/${guildId}`, fileName);
        return guildInfo;
    }

    async getChannels(guildId) {
        const fileName = `guilds/${guildId}/channels.json`
        const channels = await this.discordFetch(`guilds/${guildId}/channels`, fileName);
        return channels;
    }

    async getUserProfile() {
        const fileName = `users/${this.hashedToken}/me.json`
        const guild = await this.discordFetch(`users/@me`, fileName);
        return guild;
    }


    async getGuildUserProfile(userId, guildId) {
        const fileName = `users/${this.hashedToken}/guilds/${guildId}/me.json`;
        const profile = await this.discordFetch(`users/${userId}/profile?with_mutual_guilds=false&guild_id=${guildId}`, fileName);
        return profile;
    }


    async hasChannelViewPermission(channels, channelId, roles) {
        const channel = channels.find(c => c.id === channelId);

        // if (channel.parent_id !== null) {
        //     const hasParentPermission = await this.hasChannelViewPermission(channels, channel.parent_id, roles);
        //     if (!hasParentPermission) {
        //         // console.log("No permission to view channel", channel.name, "because parent category is not visible");
        //         return false;
        //     }
        // }

        let guildId = channel.guild_id;
        const VIEW_CHANNEL = 1024

        let hasPermission = true;
        let guildOverwrite = channel.permission_overwrites.find(overwrite => overwrite.id === guildId);
        if (guildOverwrite) {
            if (parseInt(guildOverwrite.deny) & VIEW_CHANNEL) {
                // console.log("Guild overwrite denies view channel", channel.name, guildOverwrite);
                hasPermission = false;
            }
        }

        // role overwrites
        let roleOverwrites = channel.permission_overwrites.filter(overwrite => roles.includes(overwrite.id));
        for (let overwrite of roleOverwrites) {
            if (parseInt(overwrite.deny) & VIEW_CHANNEL) {
                // console.log("denied", channel.name, overwrite.id);
                hasPermission = false;
            }
        }
        for (let overwrite of roleOverwrites) {
            if (parseInt(overwrite.allow) & VIEW_CHANNEL) {
                // console.log("allowed", channel.name, overwrite.id);
                hasPermission = true;
                return hasPermission;
            }
        }
        return hasPermission;
    }

    async getAllowedChannels(guildId) {
        console.log("Getting channels for guild", guildId);
        let channels = await this.getChannels(guildId);
        let guildInfo = await this.getGuild(guildId);
        let userProfile = await this.getUserProfile()
        let guildProfile = await this.getGuildUserProfile(userProfile.id, guildId);

        let memberRoles = guildProfile.guild_member.roles;

        // loop channels and check if the user has access to the channel
        let hasAccess = [];
        let noAccess = [];
        for (const channel of channels) {
            if (channel.parent_id !== null) {
                if (await this.hasChannelViewPermission(channels, channel.id, memberRoles)) {
                    hasAccess.push(channel);
                }
                else {
                    noAccess.push(channel);
                }
            }
        }
        // console.log("Has access", JSON.stringify(hasAccess.map(c => c.name), null, 2));
        // console.log("No access", JSON.stringify(noAccess.map(c => c.name), null, 2));
        return hasAccess;
    }

    async getThreads(guildId, channelId) {
        let offset=0;
        let allThreads = [];
        while(true) {
            const fileName = `guilds/${guildId}/threads/${channelId}_${offset}.json`;
            let threads = await this.discordFetch(`channels/${channelId}/threads/search?archived=true&sort_by=last_message_time&sort_order=desc&limit=25&offset=${offset}`, fileName);
            allThreads = allThreads.concat(threads.threads);
            if (!threads.has_more) {
                break;
            }
            offset += 25;
        }
        return allThreads;
    }
}