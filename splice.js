const path = require("path")
const assert = require("assert")
const jimp = require("jimp")
const CliMan = require("climan").CliMan
const glob = require("glob")

function isEmpty(image, x0, y0, width, height) {
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			if (image.getPixelColor(x0 + x, y0 + y) & 0xFF > 0x80) {
				return false
			}
		}
	}
	return true
}

CliMan.run({
	name: "slice",
	help: "slice image to tiles",
	options: [
		{
			name: "help",
			symbol: "h",
			help: "display help and exit",
			boolean: true,
			handler: CliMan.help
		},
		{
			name: "tileSize",
			symbol: "s",
			help: "target tile size",
			default: "120",
			parser: CliMan.parsers.integer
		},
		{
			name: "outputPath",
			symbol: "o",
			help: "path to output directory",
			default: "."
		}
	],
	commands: [
		{
			name: "split",
			help: "split single image into a numbered sequence of tiles",
			handler: async (files, options) => {
				for (const file of [].concat(...files)) {
					console.log(`processing ${file}`)
					const image = await jimp.read(file)
					const width = image.getWidth()
					const height = image.getHeight()
					assert((width % options.tileSize) + (height % options.tileSize) == 0, `invalid image dimensions: ${width}x${height}`)
					const match = path.basename(file).match(/^(?<name>.+?)(?<sufix>-fg|-navmap)?\.(?:png|PNG)$/)
					assert(match, "invalid image file name")
					let cnt = 0
					for (let x = 0; x < width; x += options.tileSize) {
						for (let y = 0; y < height; y += options.tileSize) {
							cnt += 1
							if (!isEmpty(image, x, y, options.tileSize, options.tileSize)) {
								const outputFile = `${match.groups.name}-${cnt}${match.groups.sufix || ""}.png`
								console.log(`write ${outputFile}`)
								await image.clone()
									.crop(x, y, options.tileSize, options.tileSize)
									.writeAsync(path.resolve(options.outputPath, outputFile))
							}
						}
					}
				}
			},
			parameters: [{
				name: "images",
				help: "input images",
				parser: value => {
					const files = glob.sync(value)
					return files.length ? files : null
				},
				repeatable: true
			}]
		},
		{
			name: "extract",
			help: "extract a single tile from an image",
			handler: async (files, options) => {
				for (const file of [].concat(...files)) {
					console.log(`processing ${file}`)
					const image = await jimp.read(file)
					const width = image.getWidth()
					const height = image.getHeight()
					assert((width % options.tileSize) + (height % options.tileSize) == 0, `invalid image dimensions: ${width}x${height}`)
					const match = path.basename(file).match(/^(?<name>.+?)(?<sufix>-fg)?\.(?:png|PNG)$/)
					assert(match, "invalid image file name")
					let offset = null
					for (let x = 0; x < width; x += options.tileSize) {
						for (let y = 0; y < height; y += options.tileSize) {
							const match = path.basename(file).match(/^(?<name>.+?)(?<sufix>-fg)?\.(?:png|PNG)$/)
							assert(match, "invalid image file name")
							if (!isEmpty(image, x, y, options.tileSize, options.tileSize)) {
								assert(offset == null, "image contains multiple tiles")
								offset = [x, y]
							}
						}
					}
					assert(offset != null, "empty image")
					const outputFile = `${match.groups.name}${match.groups.sufix || ""}.png`
					console.log(`write ${outputFile}`)
					await image.crop(...offset, options.tileSize, options.tileSize).writeAsync(path.resolve(options.outputPath, outputFile))
				}
			},
			parameters: [{
				name: "images",
				help: "input images",
				parser: value => {
					const files = glob.sync(value)
					return files.length ? files : null
				},
				repeatable: true
			}]
		}
	],
})

process.on('unhandledRejection', error => {
	console.error(error)
	process.exit(1)
})
