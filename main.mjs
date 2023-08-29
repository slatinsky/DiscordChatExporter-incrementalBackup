import fs from 'fs';
import { parseArgsStringToArgv } from 'string-argv';
import clc from 'cli-color';
import { spawn } from 'cross-spawn';

function createDirectory(path) {
    try {
        fs.mkdirSync(path);
    }
    catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}


class CacheMetadata {
    constructor() {
        this.config = {}
        createDirectory("./exports");
        this.read();
    }

    read() {
        if (fs.existsSync("./exports/metadata.json")) {
            this.config = JSON.parse(fs.readFileSync("./exports/metadata.json"));
        }
        else {
            this.config = {};
        }
    }

    save() {
        fs.writeFileSync("./exports/metadata.json", JSON.stringify(this.config, null, 2));
    }

    get(category, key) {
        this.read();
        if (!this.config[category]) {
            return null;
        }
        return this.config[category][key];
    }

    set(category, key, value) {
        this.read();
        if (!this.config[category]) {
            this.config[category] = {};
        }
        this.config[category][key] = value;
        this.save();
    }
}


async function execCommand(command) {
    const commandRedacted = command.replace(/--token [-A-Za-z0-9+\/=\._]+/, '--token <REDACTED>');
    console.log(clc.blackBright(commandRedacted));
    let cmd_args = parseArgsStringToArgv(command);
    let cmd = cmd_args.shift();
    var child = spawn.sync(cmd, cmd_args, { stdio: 'inherit' });
    if(child.error) {
        console.log("ERROR: ",child.error);
        process.exit(1);
    }
}

class Exporter {
    constructor(token, guildid, guildname) {
        this.token = token;
        this.guildId = guildid;
        this.guildName = guildname;
        this.metadata = new CacheMetadata();
        createDirectory("./exports");
        createDirectory("./exports/" + this.guildName);
    }

    async export() {
        let lastTimestamp = this.metadata.get("lastExportsTimestamps", this.guildId);
        let nowTimestamp = new Date().toISOString()  // example 2023-08-26T02:46:30.229Z
        const nowTimestampFolder = nowTimestamp.slice(0, 19).replace(/:/g, '-').replace("T", "--");  // example 2023-08-26--02-46-30
        console.log("lastTimestamp", lastTimestamp);
        console.log("nowTimestamp", nowTimestamp);

        // base command
        let command = `DiscordChatExporter.Cli exportguild --include-threads --include-archived-threads --format Json --media --reuse-media --fuck-russia --markdown false --token ${this.token} --guild ${this.guildId} --media-dir 'exports/${this.guildName}/_media/' --output 'exports/${this.guildName}/${nowTimestampFolder}/'`

        if (lastTimestamp != null) {
            // if not first export
            command += ` --after '${lastTimestamp}'`
        }
        await execCommand(command)

        // after export is confirmed to be done, save the timestamp
        // if users cancels the export, the timestamp will not be saved and the export will be tried again next time
        this.metadata.set("lastExportsTimestamps", this.guildId, nowTimestamp);
    }
}


if (!fs.existsSync("./config.json")) {
    console.log("./config.json does not exist")
    console.log('fill in config.json to get started');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync("./config.json"));

const tokens = {}

for (const token of config.tokens) {
    tokens[token['name']] = token['value']
}


for (const guild of config.guilds) {
    if (!tokens[guild.tokenName]) {
        console.log("tokenName not found in tokens, check config.json")
        process.exit(1);
    }
    if (!guild.enabled) {
        console.log("skipping disabled guild", guild.guildName)
        continue;
    }
    const exporter = new Exporter(tokens[guild.tokenName], guild.guildId, guild.guildName);
    exporter.export();
}