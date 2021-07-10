const fs = require("fs")
const path = require("path")
const assert = require("assert")

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
		assert(prop.name in props, JSON.stringify([prop.name, sprite]))
		switch (props[prop.name]) {
			case "list":
				assert(prop.type == "string", sprite.resource)
				sprite[prop.name] = prop.value.trim().split(/\s+/)
				break
			case "json":
				assert(prop.type == "string", sprite.resource)
				sprite[prop.name] = JSON.parse(prop.value)
				break
			default:
				assert(prop.type == props[prop.name], sprite.resource)
				sprite[prop.name] = prop.value
		}
	}
	return sprite
}

class TilesetStorage {
	idMap = new Map()
	nameMap = new Map()
	touched = new Set()
	files = new Map()
	list = []

	constructor(resources) {
		for (const key in resources) {
			const sprite = {resource: key}
			this.idMap.set(key, this.list.length)
			this.nameMap.set(key, sprite)
			this.list.push(sprite)
		}
	}

	getId(sprite) {
		const id = this.idMap.get(sprite.resource)
		assert(typeof id == "number")
		return id
	}

	getFile(filePath) {
		const entries = this.files.get(path.basename(filePath, ".json"))
		assert(entries, `tileset ${path.basename(filePath, ".json")} not found`)
		return entries
	}

	addFile(filePath) {
		const data = JSON.parse(fs.readFileSync(filePath))
		const entries = []
		for (const tile of data.tiles) {
			const name = path.basename(tile.image, ".png")
			if (name.endsWith("-zone")) {
				entries.push({id: tile.id, sprite: {resource: name.slice(0, -5), zone: true}})
				continue
			}
			const sprite = this.nameMap.get(name)
			assert(sprite, `resource not found: ${name}`)
			assert(!this.touched.has(name), `resource redefined: ${name}`)
			this.touched.add(name)
			entries.push({id: tile.id, sprite})
			if (tile.objectgroup && tile.objectgroup.objects) {
				let data = tile.objectgroup.objects
				for (const parser of objectParsers) {
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
					revealed: "bool",
					composite: "json",
					animation: "json",
					group: "string",
					gateway: "string",
					zOffset: "int",
					class: "list"
				})
				if (sprite.plugs && sprite.plugs[0] == "[") {
					sprite.plugs = JSON.parse(sprite.plugs)
				} else if (sprite.plugs) {
					sprite.plugs = ["-plug-up", "-plug-down", "-plug-left", "-plug-right"].map(x => sprite.plugs + x)
				}
			}
		}
		this.files.set(path.basename(filePath, ".json"), entries)
	}
}

function buildMap(mapFile, tilesetStorage) {
	const map = JSON.parse(fs.readFileSync(mapFile))
	const tileMap = new Map()
	for (const tileset of map.tilesets) {
		tilesetStorage.getFile(tileset.source).forEach(x => tileMap.set(x.id + tileset.firstgid, x.sprite))
	}

	const objects = []
	for (let i = 1; i < map.layers.length; i += 1) {
		for (const object of map.layers[i].objects) {
			if (!object.gid) {
				if (object.polyline) {
					objects.push(parseProperties(object.properties, {
						type: "path",
						position: [object.x + object.polyline[0].x, object.y + object.polyline[0].y],
						points: object.polyline.map(point => [point.x - object.polyline[0].x, point.y - object.polyline[0].y]),
						name: object.name
					}))
				} else if (object.point) {
					objects.push(parseProperties(object.properties, {
						type: "point",
						position: [object.x, object.y],
						name: object.name
					}, {zOffset: "int"}))
				} else {
					objects.push(parseProperties(
						object.properties,
						{
							type: "zone",
							name: object.name && !object.name.startsWith("@") ? object.name : undefined,
							position: [object.x, object.y],
							dimensions: [object.width, object.height]
						},
						{
							enabled: "bool",
							class: "list"
						}
					))
				}
			} else {
				const sprite = tileMap.get(object.gid & 0xFFFFFF)
				assert(sprite, `resource with gid ${object.gid & 0xFFFFFF} not found (${JSON.stringify(object)})`)
				if (sprite.zone) {
					objects.push(parseProperties(
						object.properties,
						{
							type: "zone",
							name: object.name && !object.name.startsWith("@") ? object.name : undefined,
							position: [object.x, object.y - object.height],
							dimensions: [object.width, object.height],
							resource: sprite.resource
						},
						{
							enabled: "bool",
							class: "list"
						}
					))
				} else {
					objects.push(parseProperties(
						object.properties,
						{
							type: "item",
							name: object.name && !object.name.startsWith("@") ? object.name : undefined,
							position: [object.x, object.y],
							sprite: sprite.name || sprite.resource,
							flipped: (object.gid & 0x80000000) ? true : undefined
						},
						{
							animation: "json",
							zOffset: "int",
							class: "list",
							enabled: "bool"
						}
					))
				}
			}
		}
	}
	const tiles = map.layers[0].data.map(id => id ? (tilesetStorage.getId(tileMap.get(id)) + 1) : 0)
	return {
		name: path.basename(mapFile, ".json"),
		objects,
		tiles: tiles,
		height: map.layers[0].height,
		width: map.layers[0].width
	}
}

function buildTilesets(files, resources) {
	const storage = new TilesetStorage(resources)
	files.forEach(x => storage.addFile(x))
	return storage
}

function buildMaps(files, tilesetStorage) {
	return files.map(x => buildMap(x, tilesetStorage))
}

module.exports = {
	buildTilesets,
	buildMaps
}
