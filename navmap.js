const path = require("path")
const jimp = require("jimp")
const glob = require("glob")
const fs = require("fs")

function computeConnectionMask(image) {
	const width = image.getWidth()
	const height = image.getHeight()
	let connectionMask = 0
	for (let x= 0; x < width; x += 1) {
		if ((image.getPixelColor(x, 0) & 0xFF) > 16) {
			connectionMask |= 1
			break
		}
	}
	for (let y = 0; y < height; y += 1) {
		if ((image.getPixelColor(0, y) & 0xFF) > 16) {
			connectionMask |= 2
		}
	}
	for (let x = 0; x < width; x += 1) {
		if ((image.getPixelColor(x, height - 1) & 0xFF) > 16) {
			connectionMask |= 4
			break
		}
	}
	for (let y = 0; y < height; y += 1) {
		if ((image.getPixelColor(width - 1, y) & 0xFF) > 16) {
			connectionMask |= 8
			break
		}
	}
	return connectionMask
}

function findBounds(image) {
	const width = image.getWidth()
	const height = image.getHeight()
	let xMin = width - 1
	let xMax = 0
	let yMin = height - 1
	let yMax = 0
	for (let y = 0; y < width; y += 1) {
		for (let x = 0; x < xMin; x += 1) {
			if ((image.getPixelColor(x, y) & 0xFF) > 16) {
				xMin = Math.min(x, xMin)
				break
			}
		}
	}
	for (let y = 0; y < width; y += 1) {
		for (let x = width - 1; x > xMax; x -= 1) {
			if ((image.getPixelColor(x, y) & 0xFF) > 16) {
				xMax = Math.max(x, xMax)
				break
			}
		}
	}
	for (let x = xMin; x <= xMax; x += 1) {
		for (let y = 0; y < yMin; y += 1) {
			if ((image.getPixelColor(x, y) & 0xFF) > 16) {
				yMin = Math.min(y, yMin)
				break
			}
		}
	}
	for (let x = xMin; x <= xMax; x += 1) {
		for (let y = height - 1; y > yMax; y -= 1) {
			if ((image.getPixelColor(x, y) & 0xFF) > 16) {
				yMax = Math.max(y, yMax)
				break
			}
		}
	}
	return {
		x: xMin,
		y: yMin,
		width: (xMax - xMin) + 1,
		height: (yMax - yMin) + 1
	}
}

function convert(image) {
	const bounds = findBounds(image)
	const data = new Uint8Array(Math.ceil((bounds.width * bounds.height) / 8))
	let accumulator = 0
	let cnt = 0
	for (let y = 0; y < bounds.height; y++) {
		for (let x = 0; x < bounds.width; x++) {
			accumulator >>= 1
			if ((image.getPixelColor(bounds.x + x, bounds.y + y) & 0xFF) > 16) {
				accumulator |= 0x80
			}
			cnt += 1
			if ((cnt & 7) == 0) {
				data[(cnt >> 3) - 1] = accumulator
				accumulator = 0
			}
		}
	}
	if (cnt & 7) {
		accumulator >>= 8 - (cnt & 7)
		data[cnt >> 3] = accumulator
	}
	/*for (let y = 0; y < bounds.height; y++) {
		let str = ""
		for (let x = 0; x < bounds.width; x++) {
			const index = y * bounds.width + x
			str += (data[index >> 3] & (1 << (index & 7))) ? "#" : " "
		}
		console.log(str)
	}*/
	return {bounds, data, junctions: computeConnectionMask(image)}
}

async function build(files) {
	const elements = []
	for (const file of files) {
		elements.push({...convert(await jimp.read(file)), name: path.basename(file, "-navmap.png")})
	}
	const data = new Uint8Array(elements.reduce((a, b) => a + b.data.length, 0))
	const objects = {}
	let address = 0
	for (const element of elements) {
		objects[element.name] = {
			...element.bounds,
			junctions: element.junctions,
			address
		}
		data.set(element.data, address)
		address += element.data.length
	}
	return {objects, data}
}

function detectChanges(output, sources) {
	if (!fs.existsSync(output)) {
		return true
	}
	const time = fs.statSync(output).mtimeMs
	for (const file of sources) {
		if (time < fs.statSync(file).mtimeMs) {
			return true
		}
	}
	return false
}


module.exports = async (target, input) => {
	files = glob.sync(path.resolve(input, "*-navmap.png"))
	if (!detectChanges(target + ".bin", files)) {
		//return
	}
	const {objects, data} = await build(files)
	fs.writeFileSync(target + ".bin", data)
	fs.writeFileSync(target + ".json", JSON.stringify({type: "navmap", data: objects}))
}
