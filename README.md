# Incremental discord backups

Simple wrapper for [Tyrrrz/DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) to make incremental backups of Discord channels, including threads and forum posts to be viewed in [slatinsky/DiscordChatExporter-frontend](https://github.com/slatinsky/DiscordChatExporter-frontend)


## How to archive discord servers incrementally (Windows)

1. Install .NET 7.0 runtime by following [this guide](https://github.com/Tyrrrz/DiscordChatExporter/blob/master/.docs/Dotnet.md)
2. Download beta version of DiscordChatExporter.Cli from [Tyrrrz/DiscordChatExporter/actions](https://github.com/Tyrrrz/DiscordChatExporter/actions) -> main workflow -> `DiscordChatExporter.Cli` artifact (Threads support is not yet available in the stable version). You need to be logged in to Github to download the artifact.
3. Download release (`DiscordChatExporter-incrementalBackup-vX.X.X-win.zip`) of this project from [slatinsky/DiscordChatExporter-incrementalBackup/releases](https://github.com/slatinsky/DiscordChatExporter-incrementalBackup/releases)
4. Download `DiscordChatExporter-frontend-vX.X.X-win.zip` from [slatinsky/DiscordChatExporter-frontend/releases](https://github.com/slatinsky/DiscordChatExporter-frontend/releases)
5. create new empty folder
6. Copy `dcef.exe` and `dcef/` folder from `DiscordChatExporter-frontend-vX.X.X-win.zip` to the new folder
7. Copy `backup.exe` from `DiscordChatExporter-incrementalBackup-vX.X.X-win.zip` to the new folder
8. Create `dce/` folder if it doesn't exist
9. Copy contents of `DiscordChatExporter-frontend-vX.X.X-win.zip` to `dce/` folder.
10. rename `config.example.json` to `config.json`

Directory structure should look like this:

```
dce/
    ...
    DiscordChatExporter.Cli.exe
    ...

dcef/
    backend/
        ...

    frontend/
        ...

backup.exe
config.json
dcef.exe
```

11. Get your discord token by following [this guide](https://github.com/Tyrrrz/DiscordChatExporter/blob/master/.docs/Token-and-IDs.md)
12. enable developer mode in discord in settings -> advanced -> developer mode
13. right click on the server icon you want to backup and select `Copy ID`
13. Edit `config.json` in your favorite text editor and fill in your discord token and guild ids

Example:
- my discord token is `bXlzZWNyZXRkaXNjb3JkdG9rZW4=`
- server id I want to back up is `123456789012345678`

config.json will look like this:
```json
{
    "tokens": [
        {
            "name": "mytoken",
            "value": "bXlzZWNyZXRkaXNjb3JkdG9rZW4"
        }
    ],
    "guilds": [
        {
            "tokenName": "mytoken",
            "guildId": "123456789012345678",
            "guildName": "guild-name",
            "enabled": true
        }
    ]
}
```

(try not to use special characters in `guildName` not allowed in file names)

14. run `backup.exe` and wait for it to finish. Your exports will be in `exports` folder.
15. run `dcef.exe` to browse your exports

Next time you want to back up your guilds, just run `backup.exe` again. It will only export messages that were sent after the last export.

You can also schedule `backup.exe` to run periodically using Windows Task Scheduler.

## Configuration file

- `tokens.name` - your name for the discord token
- `tokens.token` - your discord token
- `guilds.tokenName` - your name for the discord token defined in `tokens.name`
- `guilds.guildId` - the id of the guild you want to backup
- `guilds.guildName` - name of the folder where the guild will be saved
- `guilds.enabled` - if true, the guild will be backed up

## How it works

The script will call `DiscordChatExporter.Cli` according to configuration file `config.json`. Start time of the export is saved in `exports/metadata.json`, so the next time the script is run, it will only export messages that were sent after the last export. The script will also export threads and forum posts.

## License
GNU GENERAL PUBLIC LICENSE

## Contributing
Feel free to open issues and pull requests.

If you find this project useful, give it a star ⭐. Thank you!