# Incremental discord backups
Simple wrapper for Tyrrrz/DiscordChatExporter to make incremental backups of Discord channels.

## Bestiary
- Guild - A Discord server
- Channel - A Discord channel
- Thread - A Discord thread. Forum posts are threads too.

## Features
- Incremental backups
- Tries to export only new channels or channels with new messages
- Forums and thread downloads are supported (only archived threads are downloaded)
- Use user tokens or (WIP) bot tokens
- Paranoid mode - excessive delays between requests to avoid being rate limited

## Limitations
The script is made to be run only once per day. Unexpected behavior may occur if you run it more often.

## Quick start (Windows)
Prebuilt binaries are provided for a convenience. For scripts that interact with sensitive data (like your discord token) is good practice to build the binaries yourself or run them from source, so you can verify that the code is safe.

0. Add folder that includes `DiscordChatExporter.Cli.exe` to your PATH environment variable and restart your terminal.
1. Download the latest release from [here]()
2. Extract the archive
3. Run `IncrementalBackups.exe` to run the script

## Running from source (Linux or Windows)
0. Add folder that includes `DiscordChatExporter.Cli` to your PATH environment variable and restart your terminal.
1. Make sure you have git, nodejs and nvm installed
2. Clone the repository
3. Run `node --version` to make sure you use nodejs 16.16.0
4. If you use different node version, switch to 16.16.0 by running `nvm install 16.16.0` and `nvm use 16.16.0`
5. Run `npm install` to install dependencies
6. Run `node main.mjs` to run the script


## Usage
```bash
node main.mjs channels --guild <guild_id> --token <token1> [--token <token2>] [--token <token3>...]  --output <export_dir> [--dryrun] [--checkall]
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
NOTE: discord api will be used even if dryrun is used, but results it will be cached, so you can rerun the script without --dryrun without requesting the same data again.

Default: false

### --checkall (optional)
Check all channels for updated threads/forum_posts even if the channel has no new messages. Usefull for FIRST time backups if you already made Json exports without this tool in the past and need to download threads and forum posts. Not needed otherwise and wastes discord api calls.

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
