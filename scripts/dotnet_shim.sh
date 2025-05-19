#!/bin/bash
# This is used to bridge the calls in main.js:94/97 to DCE on Linux
$(which dotnet) /app/dce/DiscordChatExporter.Cli.dll $@