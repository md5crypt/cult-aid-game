#!/bin/sh
trap "exit" INT TERM ERR
trap "kill 0" EXIT
node express.js &
./node_modules/.bin/tsc --watch &
./node_modules/.bin/watchify --bare -d -o build/app.js build/main.js
