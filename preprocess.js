const fs = require("fs")
const path = require("path")
const glob = require("glob")
const texturePacker = require("./atlas/packer")
const fontParser = require("./fontParser")
const speechParser = require("./speechParser")
const tileParser = require("./tileParser")
const navmap = require("./navmap")

function parseFonts(fontsPath) {
	return glob.sync(path.resolve(fontsPath, "*.fnt"))
		.map(file => fontParser(fs.readFileSync(file, "ascii")))
}

function parseSpeech(speechPath) {
	const data = {characters: JSON.parse(fs.readFileSync(path.resolve(speechPath, "characters.json"), "utf8"))}
	glob.sync(path.resolve(speechPath, "*.txt"))
		.forEach(file => speechParser.parse(fs.readFileSync(file, "utf8"), file, data))
	speechParser.finalize(data)
	fs.mkdirSync("scripts/src/types", {recursive: true})
	fs.writeFileSync(path.resolve("scripts/src/types", "fragments.d.ts"), "declare const enum FragmentId { " + Object.keys(data.fragments).map(x => JSON.stringify(x) + " = " + JSON.stringify(x)).join(", ") + "}")
	fs.writeFileSync(path.resolve("scripts/src/types", "dialogs.d.ts"), "declare const enum DialogId { " + Object.keys(data.dialogs).map(x => JSON.stringify(x) + " = " + JSON.stringify(x)).join(", ") + "}")
	return data
}

function buildObjectEnums(maps) {
	fs.mkdirSync("scripts/src/types", {recursive: true})
	const idSet = new Set()
	const typeSets = new Map()
	typeSets.set("map", new Set())
	typeSets.set("class", new Set())
	for (const map of maps) {
		typeSets.get("map").add(map.name)
		for (const object of map.objects) {
			if (object.class) {
				object.class.forEach(x => typeSets.get("class").add(x))
			}
			if (!object.name) {
				continue
			}
			if (idSet.has(object.name)) {
				throw new Error(`non-unique object name: ${object.name}`)
			}
			idSet.add(object.name)
			let set = typeSets.get(object.type)
			if (!set) {
				set = new Set()
				typeSets.set(object.type, set)
			}
			set.add(object.name)
		}
	}
	for (const [type, set] of typeSets.entries()) {
		if (!set.size) {
			continue
		}
		const re = new RegExp(`^${type}-`)
		fs.writeFileSync(
			path.resolve("scripts/src/types", type + ".d.ts"),
			`declare const enum ${type[0].toUpperCase() + type.slice(1)}Id { ` + Array.from(set.values()).map(x => JSON.stringify(x.replace(re, "")) + " = " + JSON.stringify(x)).join(", ") + "}"
		)
	}
}

async function run() {
	const atlas = {}
	for (const name of ["tiles", "ui"]) {
		atlas[name] = await texturePacker(`atlas/${name}.ftpp`)
	}
	await navmap("build/navmap", "atlas/tiles")
	const tilesets = tileParser.buildTilesets(glob.sync("tileset/tileset*.json"), atlas.tiles)
	const maps = tileParser.buildMaps(glob.sync("map/map*.json"), tilesets)
	buildObjectEnums(maps)
	fs.writeFileSync("build/data.json", JSON.stringify({type: "gameData", data: {sprites: tilesets.list, maps}}))
	fs.writeFileSync("build/fonts.json", JSON.stringify({type: "fontData", data: parseFonts("fonts")}))
	fs.writeFileSync("build/speech.json", JSON.stringify({type: "speechData", data: parseSpeech("speech")}))
}

run()

process.on('unhandledRejection', error => {
	console.error(error)
	process.exit(1)
})
