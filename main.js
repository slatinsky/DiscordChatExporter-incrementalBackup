// pkg requires require syntax
const fs = require('fs').promises;
const parseArgsStringToArgv = require('string-argv').parseArgsStringToArgv;
const clc = require('cli-color');
const spawn = require('cross-spawn');

async function createDirectory(path) {
    try {
        await fs.mkdir(path, { recursive: true });
    }
    catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}


class CacheMetadata {
    constructor() {
        this.config = {}
        this.filePath = "./exports/metadata.json";
        this.read();
    }

    async read() {;
        try {
            this.config = JSON.parse(await fs.readFile(this.filePath, 'utf8'))
        } catch (err) {
            if (err.code === 'ENOENT') {
                await createDirectory("./exports");
                await fs.writeFile(this.filePath, JSON.stringify({}))
                this.config = {};
            } else {
                console.error(err)
            }
        }
    }

    async save() {
        await fs.writeFile(this.filePath, JSON.stringify(this.config, null, 2))
    }

    async get(category, key) {
        await this.read();
        if (!this.config[category]) {
            return null;
        }
        return this.config[category][key];
    }

    async set(category, key, value) {
        await this.read();
        if (!this.config[category]) {
            this.config[category] = {};
        }
        this.config[category][key] = value;
        await this.save();
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

    }

    async export() {
        await createDirectory("./exports");
        await createDirectory("./exports/" + this.guildName);
        let lastTimestamp = await this.metadata.get("lastExportsTimestamps", this.guildId);
        let nowTimestamp = new Date().toISOString()  // example 2023-08-26T02:46:30.229Z
        const nowTimestampFolder = nowTimestamp.slice(0, 19).replace(/:/g, '-').replace("T", "--");  // example 2023-08-26--02-46-30
        console.log("lastTimestamp", lastTimestamp);
        console.log("nowTimestamp", nowTimestamp);

        // base command
        let command = `dce/DiscordChatExporter.Cli exportguild --include-threads All --format Json --media --reuse-media --fuck-russia --markdown false --token ${this.token} --guild ${this.guildId} --media-dir 'exports/${this.guildName}/_media/' --output 'exports/${this.guildName}/${nowTimestampFolder}/'`

        if (lastTimestamp != null) {
            // if not first export
            command += ` --after '${lastTimestamp}'`
        }
        await execCommand(command)

        // after export is confirmed to be done, save the timestamp
        // if users cancels the export, the timestamp will not be saved and the export will be tried again next time
        await this.metadata.set("lastExportsTimestamps", this.guildId, nowTimestamp);
    }
}

async function main() {
    let config = {}
    const configPath = "./config.json"
    try {
        // read config
        const data = await fs.readFile(configPath, 'utf8')
        config = JSON.parse(data);
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            console.log("./config.json does not exist")
            console.log('copy config.example.json to config.json and fill in the values to get started');
            process.exit(1);
        } else {
            throw e;
        }
    }

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
            console.log(`skipping guild '${guild.guildName}', because guilds.enabled is false`)
            continue;
        }
        const exporter = new Exporter(tokens[guild.tokenName], guild.guildId, guild.guildName);
        await exporter.export();
    }
}


main();
