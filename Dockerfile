################################################################################
#
# Name:     slatinsky/DiscordChatExporter-incrementalBackup
# Version:  0.0.2
# License:  GPL
# Sources:  github:Tyrrrz/DiscordChatExporter
#
# Usage:    You'll need to mount a volume containing config.json to /app/config
#           The export directory goes to /app/export
################################################################################
FROM alpine:latest

RUN apk update \
    && apk add aspnetcore7-runtime bash npm

RUN mkdir -p /app/config/ /app/dce/ /app/exports/ \
    && wget https://github.com/Tyrrrz/DiscordChatExporter/releases/download/2.42.3/DiscordChatExporter.Cli.zip \
    && unzip DiscordChatExporter.Cli.zip -d /app/dce/ \
    && rm DiscordChatExporter.Cli.zip
WORKDIR /app

ADD . /app 

RUN mv /app/scripts/run_backup.sh /app/run_backup.sh \
    && chmod +x /app/run_backup.sh \
    && mv /app/scripts/dotnet_shim.sh /app/dce/DiscordChatExporter.Cli \
    && chmod +x /app/dce/DiscordChatExporter.Cli \
    && ln -s /app/config/config.json /app/config.json

RUN npm install

CMD [ "bash", "/app/run_backup.sh" ]