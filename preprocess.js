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
	fs.writeFileSync(path.resolve("scripts/src/types", "fragments.d.ts"), (
		"declare const enum FragmentId { " +
		Object.keys(data.fragments).map(x => JSON.stringify(x) + " = " +
		JSON.stringify(x)).join(", ") + "}\n" +
		"declare type FragmentInvokeKeys = " + JSON.stringify(Object.fromEntries(
			Object.entries(data.fragments)
				.map(x => [x[0], Array.from(new Set(x[1]
					.filter(x => x.function == "invoke")
					.map(x => x.argument)
				))])
				.filter(x => x[1].length)
		), (_, x) => x === undefined ? "__undefined" : x).replace(/"__undefined"/g, "undefined")
	))
	fs.writeFileSync(path.resolve("scripts/src/types", "dialogs.d.ts"), (
		"declare const enum DialogId { " +
		Object.keys(data.dialogs).map(x => JSON.stringify(x) + " = " +
		JSON.stringify(x)).join(", ") + "}\n" +
		"declare type DialogPromptNames = " + JSON.stringify(Object.fromEntries(
			Object.entries(data.dialogs)
				.filter(x => x[1]["prompts"].length > 1)
				.map(x => [x[0], x[1]["prompts"]])
		)) + "\n" +
		"declare type DialogOptionNames = " + JSON.stringify(Object.fromEntries(
			Object.entries(data.dialogs)
				.filter(x => x[1]["options"].length > 1)
				.map(x => [x[0], x[1]["options"].map(x => x.id)])
		))
	))
	Object.entries(data.dialogs).forEach(x => delete x[1]["prompts"])
	return data
}

function postProcessObjects(maps) {
	fs.mkdirSync("scripts/src/types", {recursive: true})
	const typeSets = new Map()
	typeSets.set("map", new Set())
	typeSets.set("class", new Set())
	for (const map of maps) {
		if (!map.name.startsWith("map-")) {
			throw new Error(`map '${map.name}' must start with 'map-'`)
		}
		map.name = map.name.slice(4)
		typeSets.get("map").add(map.name)
		for (const object of map.objects) {
			if (object.class) {
				object.class.forEach(x => typeSets.get("class").add(x))
			}
			if (!object.name) {
				continue
			}
			let set = typeSets.get(object.type)
			if (!set) {
				set = new Set()
				typeSets.set(object.type, set)
			}
			if (!object.name.startsWith(object.type + "-")) {
				throw new Error(`${object.type} '${object.name}' must start with '${object.type}-'`)
			}
			object.name = object.name.slice(object.type.length + 1)
			if (set.has(object.name)) {
				throw new Error(`non-unique object name: ${object.name}`)
			}
			set.add(object.name)
		}
	}
	for (const [type, set] of typeSets.entries()) {
		if (!set.size) {
			continue
		}
		fs.writeFileSync(
			path.resolve("scripts/src/types", type + ".d.ts"),
			`declare const enum ${type[0].toUpperCase() + type.slice(1)}Id { ` + Array.from(set.values()).map(x => JSON.stringify(x) + " = " + JSON.stringify(x)).join(", ") + "}"
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
	postProcessObjects(maps)
	fs.writeFileSync(
		path.resolve("scripts/src/types", "resources.d.ts"),
		`declare const enum ResourceId {${tilesets.list.map(x => JSON.stringify(x.resource) + " = " + JSON.stringify(x.resource))}}`
	)
	fs.writeFileSync("build/data.json", JSON.stringify({type: "gameData", data: {sprites: tilesets.list, maps}}))
	fs.writeFileSync("build/fonts.json", JSON.stringify({type: "fontData", data: parseFonts("fonts")}))
	fs.writeFileSync("build/speech.json", JSON.stringify({type: "speechData", data: parseSpeech("speech")}))
}

void run()

process.on("unhandledRejection", error => {
	console.error(error)
	process.exit(1)
})
