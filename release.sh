#!/bin/sh

mkdir -p build/release
rm -rf build/release/*

cp scripts/build/bundle.js build/release/scripts.js
cp build/engine.js build/release
cp build/data.json build/release
cp build/fonts.json build/release
cp build/atlas-* build/release
cp static/* build/release

rm -rf //192.168.0.1/root/mnt/data/uwuowo/ck/game/*
cp build/release/* //192.168.0.1/root/mnt/data/uwuowo/ck/game/
