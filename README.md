# Incremental discord backups
Simple wrapper for Tyrrrz/DiscordChatExporter to make incremental backups of Discord channels.

## Features
- Incremental backups
- Tries to export only new channels or channels with new messages
- Forums and threads are supported
- Use user tokens or (WIP) bot tokens

## Quick start (Windows)
Prebuilt binaries are provided for a convenience. For scripts that interact with sensitive data (like your discord token) is good practice to build the binaries yourself or run them from source, so you can verify that the code is safe.

0. Download the latest release from [here]()
1. Extract the archive
2. Run `IncrementalBackups.exe` to run the script

## Running from source (Linux or Windows)
0. Make sure you have git, nodejs and nvm installed
1. Clone the repository
2. Run `node --version` to make sure you use nodejs 16.16.0
3. If you use different node version, switch to 16.16.0 by running `nvm install 16.16.0` and `nvm use 16.16.0`
4. Run `npm install` to install dependencies
5. Run `node main.mjs` to run the script


## Usage
```bash
node main.mjs channels --guild <guild_id> --token <token1> [--token <token2>] [--token <token3>...]  --output <export_dir>
```

### channels
Make incremental export of all channels in guild.

### --guild (required)
Discord guild id you want to backup (discords servers are internally called guilds)

### --token (required)
Supply tokens that have access to the guild you want to backup. Usefull if the previous token can't access all channels.
The tokens are used in order they are supplied. If the first token can't access a channel, the next token is used.

If you use bot token, prefix it with `Bot ` and don't forget to use quotes around the token.
If you use user token, don't prefix it with anything. Quotes around the token are not needed.

### --output (required)
Output directory where your exports are be stored. If you already have Json exports, place them to this directory and they will be used as a base for the incremental backup.

This script will place new exports to the `automated/` subdirectory in this folder and will not modify your existing exports.

### --dryrun (optional)
Don't run DiscordChatExported, just print the command that would be run.
NOTE: discord api will be used even if dryrun is used.

Default: false


### Future plans
- Add support for bot tokens
- Add support for incremental backups direct messages
- Add fastupdate mode that will only check last 25 threads for each channel (1 request per channel), not all of them
- hide tokens from logs


### Known issues
- Sometimes you will see `Failed to export 1 channel(s). No messages found for the specified period.`. That happens if the newest message in channel was deleted. This can't be fixed by this script.

## Warnings
### → NEVER SHARE YOUR TOKEN ←
A token gives full access to an account. To reset a user token, change your account password.
