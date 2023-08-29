# Incremental discord backups
Simple wrapper for [Tyrrrz/DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) to make incremental backups of Discord channels, including threads and forum posts.

## Setup (Windows)
1 Download [DiscordChatExporter.Cli](https://github.com/Tyrrrz/DiscordChatExporter/releases). DiscordChatExporter.Cli version `2.40.5` or higher is required to export threads and forum posts.
1. add folder, where you extracted DiscordChatExporter.Cli, to your PATH environment variable
2. install nodejs (at least node `16.16.0`)
3. install dependencies by running `npm install`
4. copy `config.example.json` to `config.json` and fill in the values
5. run `node main.mjs` or `BACKUP.BAT`
6. schedule `BACKUP.BAT` to run periodically

## Configuration file

- `tokens.name` - your name for the discord token
- `tokens.token` - your discord token
- `guilds.tokenName` - your name for the discord token defined in `tokens.name`
- `guilds.guildId` - the id of the guild you want to backup
- `guilds.guildName` - name of the folder where the guild will be saved (try not to use special characters not allowed in file names)
- `guilds.enabled` - if true, the guild will be backed up

## How it works

The script will call `DiscordChatExporter.Cli` according to configuration file `config.json`. Start time of the export is saved in `exports/metadata.json`, so the next time the script is run, it will only export messages after the last export.

## License
GNU GENERAL PUBLIC LICENSE

## Contributing
Feel free to open issues and pull requests.

If you find this project useful, give it a star ⭐. Thank you!