const fs = require("fs")
const path = require("path")
const assert = require("assert")
const child_process = require("child_process")

function buildSprites(atlasFile) {
	const atlas = JSON.parse(fs.readFileSync(atlasFile))
	const sprites = {}
	const array = []
	const list = Object.keys(atlas.frames).map(filename => {
		const match = filename.match(/^(.+?)(-fg)?(?:-(\d+))?$/)
		assert(match, filename)
		const o = atlas.frames[filename]
		const data = {
			frame: [o.frame.x, o.frame.y, o.frame.w, o.frame.h],
			offset: [o.spriteSourceSize.x, o.spriteSourceSize.y]
		}
		return {base: match[1], isFg: !!match[2], frame: match[3] == undefined ? undefined : parseInt(match[3], 10), data}
	}).sort((a, b) => (a.base == b.base) ? ((a.isFg == b.isFg) ? a.frame - b.frame : b.isFg) : a.base.localeCompare(b.base))
	for (const item of list) {
		const key = item.isFg ? 'fgTexture' : 'texture'
		let sprite = sprites[item.base]
		if (!sprite) {
			sprite = {name: item.base}
			array.push(sprite)
			sprites[item.base] = sprite
		}
		if (item.frame == undefined) {
			assert(!sprite[key])
			sprite[key] = item.data
		} else {
			if (!sprite[key]) {
				sprite[key] = []
			}
			assert(Array.isArray(sprite[key]))
			sprite[key].push(item.data)
		}
	}
	return array
}

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
					assert(dir.match(/^(?:up|down|left|right)$/), sprite.name)
					paths[dir].push({n: Infinity, point: [object.x, object.y]})
				}
			}
		}
		const pathsFinal = {}
		for (const [key, value] of Object.entries(paths)) {
			if (!value.length) {
				continue;
			}
			assert(value.length > 1, sprite.name)
			pathsFinal[key] = value.sort((a, b) => a.n - b.n).map((step, i, array) => {
				assert(((i == (array.length - 1)) && (step.n == Infinity)) || ((i != array.length - 1) && (step.n == i)), sprite.name)
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

function parseProperties(properties, sprite) {
	const props = {
		scale: "float",
		delay: "int",
		plugGroup: "string",
		composite: "json"
	}
	for (const prop of properties) {
		assert(prop.name in props, sprite.name)
		if (props[prop.name] == "json") {
			assert(prop.type == "string", sprite.name)
			sprite[prop.name] = JSON.parse(prop.value)
		} else {
			assert(prop.type == props[prop.name], sprite.name)
			sprite[prop.name] = prop.value
		}
	}
}

function buildMap(sprites, mapFile, tilesetFile) {
	const map = JSON.parse(fs.readFileSync(mapFile))
	const tileset = JSON.parse(fs.readFileSync(tilesetFile))
	const tileMap = new Map()
	const spriteMap = new Map()
	for (let i = 0; i < sprites.length; i++) {
		spriteMap.set(sprites[i].name, i)
	}
	for (const tile of tileset.tiles) {
		const name = tile.image.match(/^[^.]+/)[0]
		const spriteIndex = spriteMap.get(name)
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
			parseProperties(tile.properties, sprite)
		}
	}
	return {
		bg: map.layers[0].data.map(id => id ? (sprites[tileMap.get(id - 1)].texture ? tileMap.get(id - 1) + 1 : 0) : 0),
		height: map.layers[0].height,
		width: map.layers[0].width
	}
}

let rebuildAtlas = true

if (fs.existsSync("./build/atlas.json")) {
	if (fs.statSync("./build/atlas.json").mtimeMs > fs.statSync("./atlas").mtimeMs) {
		rebuildAtlas = false
	}
}

if (rebuildAtlas) {
	const cmd = path.resolve("node_modules/.bin/free-tex-packer-cli")
	child_process.execSync(cmd + " --project atlas.ftpp --output build", {stdio: 'inherit'})
}

const sprites = buildSprites("build/atlas.json")
const map = buildMap(sprites, "map/map.json", "tileset/tileset.json")
fs.writeFileSync("build/data.json", JSON.stringify({sprites, map}))
