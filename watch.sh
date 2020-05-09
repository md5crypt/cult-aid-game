#!/bin/sh
trap "exit" INT TERM ERR
trap "kill 0" EXIT
mkdir -p build
touch build/engine.js
node express.js &
./node_modules/.bin/tsc --build engine --watch &
./node_modules/.bin/tsc --build scripts --watch &
./node_modules/.bin/watchify --bare -d -o build/engine.js engine/build/main.js
