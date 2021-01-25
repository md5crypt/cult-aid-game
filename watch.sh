#!/bin/sh
trap "exit" INT TERM ERR
trap "kill 0" EXIT

echo "pre-building..."
./node_modules/.bin/tsc --build engine

node express.js &
./node_modules/.bin/tsc --build engine --watch &
./node_modules/.bin/tsc --build scripts --watch &
./node_modules/.bin/watchify -d -o build/engine.js engine/build/main.js
