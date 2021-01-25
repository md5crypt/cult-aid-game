const fs = require("fs")
const path = require("path")
const glob = require("glob")
const assert = require("assert")
const texturePacker = require('free-tex-packer-core')

function processSheet(sheet, index) {
	return Object.keys(sheet.frames).map(filename => {
		const match = filename.match(/^(.+?)(?:_(\d+))?$/)
		const o = sheet.frames[filename]
		const data = [
			o.frame.x,
			o.frame.y,
			o.frame.w,
			o.frame.h,
			o.spriteSourceSize.x,
			o.spriteSourceSize.y,
			o.sourceSize.w - o.frame.w - o.spriteSourceSize.x,
			o.sourceSize.h - o.frame.h - o.spriteSourceSize.y,
			index
		]
		return {base: match[1], frame: match[2] == undefined ? undefined : parseInt(match[2], 10), data}
	})
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

module.exports = async (projectFile) => {
	const project = JSON.parse(fs.readFileSync(projectFile, "utf8"))
	const cwd = path.dirname(path.resolve(projectFile))
	const outputPath = path.resolve(cwd, project.savePath)
	const target = path.resolve(outputPath, project.packOptions.textureName + ".json")
	const files = [].concat(...project.folders.map(folder => 
		glob.sync(path.resolve(cwd, folder, "*.png")).filter(x => !/-navmap\.png$/.test(x))
	))
	if (!detectChanges(target, files)) {
		return JSON.parse(fs.readFileSync(target)).data.frames
	}
	const options = {
		...project.packOptions,
		exporter: "jsonHash"
	}
	const result = await texturePacker.packAsync(files.map(file => ({path: file, contents: fs.readFileSync(file)})), options)
	const images = []
	const sheets = []
	for (const {name, buffer} of result) {
		const match = name.match(/(\d+)?\.(json|png)$/)
		if (match[2] == "json") {
			sheets[parseInt(match[1] || "0", 10)] = JSON.parse(buffer.toString("utf8"))
		} else {
			images[parseInt(match[1] || "0", 10)] = buffer
		}
	}
	const list = [].concat(...sheets.map((sheet, i) => processSheet(sheet, i)))
		.sort((a, b) => (a.base == b.base) ? a.frame - b.frame : a.base.localeCompare(b.base))
	const sprites = {}
	for (const item of list) {
		if (item.frame == undefined) {
			assert(!sprites[item.base], `sprite: ${JSON.stringify(item)}`)
			sprites[item.base] = item.data
		} else {
			const array = sprites[item.base] || []
			assert(Array.isArray(array) && (array.length == item.frame), `sprite: ${JSON.stringify(item)}`)
			array.push(item.data)
			sprites[item.base] = array
		}
	}
	fs.writeFileSync(target, JSON.stringify({
		type: "textureAtlas",
		data: {
			frames: sprites,
			baseTextures: images.map((_, i) => `${project.packOptions.textureName}-${i}.png`)
		}
	}))
	images.forEach((data, i) => fs.writeFileSync(path.resolve(outputPath, `${project.packOptions.textureName}-${i}.png`), data))
	return sprites
}
