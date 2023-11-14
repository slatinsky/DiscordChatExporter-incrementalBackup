#!/bin/bash
$(which node) /app/main.js
sleep 86400
exec "$(readlink -f "$0")" # replace process with new copy of itself