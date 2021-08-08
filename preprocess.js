const fs = require("fs")
const path = require("path")
const glob = require("glob")
const texturePacker = require("./atlas/packer")
const fontParser = require("./fontParser")
const speechParser = require("./speechParser")
const tileParser = require("./tileParser")
const navmap = require("./navmap")
const CliMan = require("climan").CliMan

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

async function run(options) {
	let atlas
	if (Object.values(options).every(x => !x)) {
		options.all = true
	}
	if (options.atlas || options.all) {
		console.log("processing atlas...")
		atlas = {}
		for (const name of ["tiles", "ui"]) {
			atlas[name] = await texturePacker(`atlas/${name}.ftpp`)
		}
		fs.writeFileSync("build/atlas.cache.json", JSON.stringify(atlas))
	} else if (options.map) {
		if (!fs.existsSync("build/atlas.cache.json")) {
			throw new Error("atlas cache file does not exist, rebuild atlas")
		}
		atlas = JSON.parse(fs.readFileSync("build/atlas.cache.json", "utf8"))
	}
	if (options.navmap || options.all) {
		console.log("processing navmap...")
		await navmap("build/navmap", "atlas/tiles")
	}
	if (options.map || options.all) {
		console.log("processing map...")
		const tilesets = tileParser.buildTilesets(glob.sync("tileset/tileset*.json"), atlas.tiles)
		const maps = tileParser.buildMaps(glob.sync("map/map*.json"), tilesets)
		postProcessObjects(maps)
		fs.writeFileSync(
			path.resolve("scripts/src/types", "resources.d.ts"),
			`declare const enum ResourceId {${tilesets.list.map(x => JSON.stringify(x.resource) + " = " + JSON.stringify(x.resource))}}`
		)
		fs.writeFileSync("build/data.json", JSON.stringify({type: "gameData", data: {sprites: tilesets.list, maps}}))
	}
	if (options.fonts || options.all) {
		console.log("processing fonts...")
		fs.writeFileSync("build/fonts.json", JSON.stringify({type: "fontData", data: parseFonts("fonts")}))
	}
	if (options.speech || options.all) {
		console.log("processing speech...")
		fs.writeFileSync("build/speech.json", JSON.stringify({type: "speechData", data: parseSpeech("speech")}))
	}
}

process.on("unhandledRejection", error => {
	console.error(error)
	process.exit(1)
})

if (require.main === module) {
	CliMan.run({
		name: "preprocess",
		help: "process games asset files",
		options: [
			{
				name: "help",
				symbol: "h",
				help: "display help and exit",
				boolean: true,
				handler: CliMan.help
			},
			{
				name: "all",
				boolean: true,
				help: "process everything"
			},
			{
				name: "speech",
				boolean: true,
				help: "process speech"
			},
			{
				name: "map",
				boolean: true,
				help: "process map"
			},
			{
				name: "navmap",
				boolean: true,
				help: "process navmap"
			},
			{
				name: "atlas",
				boolean: true,
				help: "process atlas"
			},
			{
				name: "fonts",
				boolean: true,
				help: "process fonts"
			}
		],
		handler: options => run(options)
	})
} else {
	module.exports = run
}
