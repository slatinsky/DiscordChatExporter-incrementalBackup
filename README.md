# Incremental discord backups
Simple wrapper for Tyrrrz/DiscordChatExporter to make incremental backups of Discord channels, including threads and forum posts.

## Features
- Incremental backups (with no overlappping messages)
- Skips channels with no new messages
- Forums and thread downloads are supported (only archived threads are downloaded)
- Use user tokens or (WIP) bot tokens
- Excessive delays between requests to avoid being rate limited

## Acronyms
- Guild - A Discord server (discords servers are internally called guilds)
- Channel - A Discord channel
- Thread - A Discord thread or forum post (forum posts are threads too)
- WIP - Work in progress - not implemented yet

## Quick start (Windows)
(NOTE: binaries are not available yet, run from source for now)

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
node main.mjs exportguild --guild <guild_id> --token <token1> [--token <token2>] [--token <token3>...]  --output <export_dir> [--dryrun] [--checkall]
```

### exportguild
Make incremental export of all channels in guild visible to the token(s) provided.

### --guild (required)
Discord guild id you want to backup.

### --token (required)
Supply tokens that have access to the guild you want to backup. Usefull if the previous token can't access all channels.
The tokens are used in order they are supplied. If the first token can't access a channel, the next token is used.

(WIP) If you use bot token, prefix it with `Bot ` and don't forget to use quotes around the token.
If you use user token, don't prefix it with anything. Quotes around the token are not needed.

NOTE: Bot token support is not finished yet, so you can't use bot tokens yet.

Need help getting your token? Check out [this guide](https://github.com/Tyrrrz/DiscordChatExporter/wiki/Obtaining-Token-and-Channel-IDs#how-to-get-user-token)

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

### --whitelist <channel_id1,channel_id2,...> (optional)
Comma separated whitelist of channel IDs to backup. Don't use spaces between channel IDs.
Doesn't affect forum_posts and threads.

Default: all channels the token has access to

### --deletecache (optional)
Cache files are used if you use the script multiple times in a day or to continue after crash without requesting discord api again. This flag deletes cache files made the same day. Useful if you want to force the script to request all data from discord api again.

Default: false

## Example commands
Create incremental backup of all channels, threads and forum posts in guild with id `123456789012345678` with bot token.
NOTE: Bot token support is not finished yet, so you can't use bot tokens yet.
```bash
node main.mjs exportguild --guild 123456789012345678 --token "Bot eW91cg.ZGlzY29yZCBib3Q.dG9rZW4" --output "C:\Users\user\Documents\DiscordChatExporter-frontend\static\input"
```

Create incremental backup of all channels, threads and forum posts in guild with id `123456789012345678` with user token.
```bash
node main.mjs exportguild --guild 123456789012345678 --token eW91cg.dXNlcg.dG9rZW4 --output "C:\Users\user\Documents\DiscordChatExporter-frontend\static\input"
```

Create incremental backup of all channels, threads and forum posts in guild with id `123456789012345678` with user token and also use another user token if the first one can't access a channel.
```bash
node main.mjs exportguild --guild 123456789012345678 --token eW91cg.dXNlcg.dG9rZW4x --token eW91cg.dXNlcg.dG9rZW4y --output "C:\Users\user\Documents\DiscordChatExporter-frontend\static\input"
```

Create incremental backup only of channels with id `9700123456789012345678` and `9700234567890123456789` and their threads and forum posts in guild with id `123456789012345678` with user token.
```bash
node main.mjs exportguild --guild 123456789012345678 --token eW91cg.dXNlcg.dG9rZW4 --output "C:\Users\user\Documents\DiscordChatExporter-frontend\static\input" --whitelist 9700123456789012345678,9700234567890123456789
```



### Future plans
- Download unarchived threads/forum posts
- Add fastupdate X mode that will only check last X threads for each channel (1 request per channel), not all of them
- Add support for bot tokens
- rewrite to TypeScript
- Add support for incremental backups of direct messages

### Known issues
- Sometimes you will see `Failed to export 1 channel(s). No messages found for the specified period.`. That happens if the newest message in channel was deleted and no other new messages exist. The script keeps track of exported last message ids in channels (`cache/blacklisted_ids.json`), so it won't try to export it again.
- The script expects you to run it only once per day. If you want to make another incremental backup on the same day, use --deletecache.

## Warnings
### → NEVER SHARE YOUR TOKEN ←
A token gives full access to an account. To reset a user token, change your account password.
