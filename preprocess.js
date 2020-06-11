const fs = require("fs")
const path = require("path")
const assert = require("assert")
const glob = require("glob")
const texturePacker = require("./atlas/packer")
const fntparser = require("./fntparser")

const objectParsers = [
	(objects, sprite) => {
		const paths = {up:[], down:[], left:[], right:[]}
		const leftover = []
		for (const object of objects) {
			if (!object.point) {
				leftover.push(object)
				continue
			}
			const pathMatch = object.name.match(/^(up|down|left|right)-(\d+)$/)
			if (pathMatch) {
				paths[pathMatch[1]].push({n: parseInt(pathMatch[2], 10), point: [object.x, object.y]})
			} else {
				const centerMatch = object.name.match(/^center\((.+)\)$/)
				if (!centerMatch) {
					leftover.push(object)
					continue
				}
				const dirs = centerMatch[1].split(',')
				for (const dir of dirs) {
					assert(dir.match(/^(?:up|down|left|right)$/), sprite.resource)
					paths[dir].push({n: Infinity, point: [object.x, object.y]})
				}
			}
		}
		const pathsFinal = {}
		for (const [key, value] of Object.entries(paths)) {
			if (!value.length) {
				continue;
			}
			assert(value.length > 1, sprite.resource)
			pathsFinal[key] = value.sort((a, b) => a.n - b.n).map((step, i, array) => {
				assert(((i == (array.length - 1)) && (step.n == Infinity)) || ((i != array.length - 1) && (step.n == i)), sprite.resource)
				return step.point
			})
		}
		if (Object.keys(pathsFinal).length > 0) {
			sprite.paths = pathsFinal
		}
		return leftover
	},
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

function buildMap(resources, mapFile, tilesetFile) {
	const map = JSON.parse(fs.readFileSync(mapFile))
	const tileset = JSON.parse(fs.readFileSync(tilesetFile))
	const tileMap = new Map()
	const sprites = []
	const spriteMap = new Map()
	const resolveSprite = name => {
		let id = spriteMap.get(name)
		if (id === undefined) {
			if (!(name in resources)){
				throw new Error(`resource '${name}' not found`)
			}
			id = spriteMap.size
			spriteMap.set(name, id)
			sprites.push({resource: name})
		}
		return id
	}
	Object.keys(resources).forEach(resolveSprite)
	for (const tile of tileset.tiles) {
		const name = tile.image.match(/^[^.]+/)[0]
		const spriteIndex = resolveSprite(name)
		assert(spriteIndex !== undefined)
		const sprite = sprites[spriteIndex]
		tileMap.set(tile.id, spriteIndex) 
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
				plugGroup: "string",
				composite: "json",
				onCreate: "string",
				animation: "json"
			})
		}
	}
	const gidMapper = id => tileMap.get(id - 1)
	const baseSize = map.tileheight
	const objects = []
	for (const object of map.layers[1].objects) {
		const cell = [
			Math.floor(object.x / baseSize),
			Math.floor((object.y - (object.text ? 0 : object.height)) / baseSize)
		]
		const offset = [
			object.x % baseSize,
			object.y % baseSize
		]
		if (!object.gid) {
			const o = {cell}
			if (object.name) {
				o.name = object.name
			}
			objects.push(parseProperties(object.properties, o, {
				onCreate: "string",
				onMove: "string",
				onUse: "string",
				onCenter: "string",
				onExit: "string",
				onEnter: "string",
			}))
		} else {
			const sprite = sprites[gidMapper(object.gid)]
			objects.push(parseProperties(object.properties, {cell, offset, sprite: sprite.name || sprite.resource}, {
				animation: "json",
				zIndex: "number",
				onCreate: "string",
				onUpdate: "string",
				onEnterView: "string",
				onExitView: "string",
			}))
		}
	}
	return {
		sprites,
		map: {
			objects,
			tiles: map.layers[0].data.map(id => id ? (gidMapper(id) + 1) : 0),
			height: map.layers[0].height,
			width: map.layers[0].width
		}
	}
}

function parseFonts(fontsPath) {
	return glob.sync(path.resolve(fontsPath, "*.fnt"))
		.map(file => fntparser(fs.readFileSync(file), "ascii"))
}

async function run() {
	const atlas = {}
	for (const name of ["tiles", "ui"]) {
		atlas[name] = await texturePacker(`atlas/${name}.ftpp`)
	}
	const data = buildMap(atlas.tiles, "map/map.json", "tileset/tileset.json")
	fs.writeFileSync("build/data.json", JSON.stringify({type: "gameData", data}))
	fs.writeFileSync("build/fonts.json", JSON.stringify({type: "fontData", data: parseFonts("fonts")}))
}

run()
