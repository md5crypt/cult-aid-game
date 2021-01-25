const fs = require("fs")
const path = require("path")
const assert = require("assert")
const glob = require("glob")
const texturePacker = require("./atlas/packer")
const fontParser = require("./fontParser")
const speechParser = require("./speechParser")
const navmap = require("./navmap")

const objectParsers = [
	(objects, sprite) => {
		const leftover = []
		for (const object of objects) {
			if (!object.point || object.name != "pivot") {
				leftover.push(object)
			} else {
				sprite.pivot = [object.x, object.y]
			}
		}
		return leftover
	}
]

function parseProperties(properties, sprite, props) {
	if (!properties) {
		return sprite
	}
	for (const prop of properties) {
		assert(prop.name in props, sprite.resource)
		if (props[prop.name] == "json") {
			assert(prop.type == "string", sprite.resource)
			sprite[prop.name] = JSON.parse(prop.value)
		} else {
			assert(prop.type == props[prop.name], sprite.resource)
			sprite[prop.name] = prop.value
		}
	}
	return sprite
}

function loadTileset(filePath, resolveSprite, tileMap) {
	const tileset = JSON.parse(fs.readFileSync(filePath))
	const tileOffset = tileMap.size == 0 ? 0 : Array.from(tileMap.keys()).reduce((a, b) => a > b ? a : b, 0) + 1
	for (const tile of tileset.tiles) {
		const name = path.basename(tile.image, ".png")
		if (name.endsWith("-navmap")) {
			tileMap.set(tile.id + tileOffset, {resource: name.slice(0, -7), index: -1})
			continue
		}
		const sprite = resolveSprite(name)
		tileMap.set(tile.id + tileOffset, sprite)
		if (tile.objectgroup && tile.objectgroup.objects) {
			let data = tile.objectgroup.objects
			for (parser of objectParsers) {
				data = parser(data, sprite)
			}
			assert(data.length == 0, tile.image)
		}
		if (tile.properties) {
			parseProperties(tile.properties, sprite, {
				scale: "float",
				delay: "int",
				plugs: "string",
				autoReveal: "bool",
				composite: "json",
				onCreate: "string",
				animation: "json",
				group: "string",
				gateway: "string"
			})
			if (sprite.plugs && sprite.plugs[0] == "[") {
				sprite.plugs = JSON.parse(sprite.plugs)
			} else if (sprite.plugs) {
				sprite.plugs = ["-plug-up", "-plug-down", "-plug-left", "-plug-right"].map(x => sprite.plugs + x)
			}
		}
	}
}

function buildMap(resources, mapFile, tilesetFiles) {
	const map = JSON.parse(fs.readFileSync(mapFile))
	const tileMap = new Map()
	const sprites = []
	const spriteMap = new Map()
	const resolveSprite = name => {
		let sprite = spriteMap.get(name)
		if (!sprite) {
			if (!(name in resources)){
				throw new Error(`resource '${name}' not found`)
			}
			sprite = {resource: name, index: sprites.length}
			sprites.push(sprite)
			spriteMap.set(name, sprite)
		}
		return sprite
	}
	Object.keys(resources).forEach(resolveSprite)
	for (let i = 0; i < tilesetFiles.length; i += 1) {
		loadTileset(tilesetFiles[i], resolveSprite, tileMap)
	}
	const gidMapper = id => tileMap.get(id - 1)
	const baseSize = map.tileheight
	const objects = []
	for (let i = 1; i < map.layers.length; i += 1) {
		for (const object of map.layers[i].objects) {
			if (!object.gid) {
				if (object.point) {
					objects.push(parseProperties(object.properties, {
						type: "point",
						position: [object.x, object.y],
						name: object.name
					}, {zIndex: "int"}))
				} else {
					const cell = [
						Math.floor(object.x / baseSize),
						Math.floor(object.y / baseSize)
					]
					objects.push(parseProperties(object.properties, {cell, type: "script"}, {
						onCreate: "string",
						onUse: "string",
						onExit: "string",
						onEnter: "string",
					}))
				}
			} else {
				const sprite = gidMapper(object.gid & 0xFFFFFF)
				if (sprite.index < 0) {
					objects.push(parseProperties(
						object.properties,
						{
							type: "zone",
							position: [object.x, object.y - object.height],
							resource: sprite.resource
						},
						{
							enabled: "bool",
							name: "string",
							onUse: "string",
							onExit: "string",
							onEnter: "string"
						}
					))
				} else {
					objects.push(parseProperties(
						object.properties,
						{
							type: "item",
							position: [object.x, object.y],
							sprite: sprite.name || sprite.resource,
							flipped: (object.gid & 0x80000000) ? true : undefined
						},
						{
							name: "string",
							animation: "json",
							zIndex: "int",
							onCreate: "string",
							onUpdate: "string",
							onEnterView: "string",
							onExitView: "string",
							enabled: "bool"
						}
					))
				}
			}
		}
	}
	const tiles = map.layers[0].data.map(id => id ? (gidMapper(id).index + 1) : 0)
	sprites.forEach(sprite => sprite.index = undefined)
	return {
		sprites,
		map: {
			objects,
			tiles: tiles,
			height: map.layers[0].height,
			width: map.layers[0].width
		}
	}
}

function parseFonts(fontsPath) {
	return glob.sync(path.resolve(fontsPath, "*.fnt"))
		.map(file => fontParser(fs.readFileSync(file, "ascii")))
}

function parseSpeech(speechPath) {
	const data = {characters: JSON.parse(fs.readFileSync(path.resolve(speechPath, "characters.json"), "utf8"))}
	glob.sync(path.resolve(speechPath, "*.txt"))
		.forEach(file => speechParser.parse(fs.readFileSync(file, "utf8"), file, data))
	speechParser.finalize(data)
	fs.writeFileSync(path.resolve("scripts/src", "fragments.d.ts"), "declare const enum FragmentId { " + Object.keys(data.fragments).map(x => JSON.stringify(x) + " = " + JSON.stringify(x)).join(", ") + "}")
	fs.writeFileSync(path.resolve("scripts/src", "dialogs.d.ts"), "declare const enum DialogId { " + Object.keys(data.dialogs).map(x => JSON.stringify(x) + " = " + JSON.stringify(x)).join(", ") + "}")
	return data
}

async function run() {
	const atlas = {}
	for (const name of ["tiles", "ui"]) {
		atlas[name] = await texturePacker(`atlas/${name}.ftpp`)
	}
	await navmap("build/navmap", "atlas/tiles")
	const data = buildMap(atlas.tiles, "map/map.json", [
		"tileset/tileset.json",
		"tileset/tileset-objects.json",
		"tileset/tileset-zones.json",
		"tileset/tileset-other.json"
	])
	fs.writeFileSync("build/data.json", JSON.stringify({type: "gameData", data}))
	fs.writeFileSync("build/fonts.json", JSON.stringify({type: "fontData", data: parseFonts("fonts")}))
	fs.writeFileSync("build/speech.json", JSON.stringify({type: "speechData", data: parseSpeech("speech")}))
}

run()

process.on('unhandledRejection', error => {
	console.error(error)
	process.exit(1)
})
