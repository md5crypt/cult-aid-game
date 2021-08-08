const glob = require("glob")
const preprocess = require("./preprocess")
const util = require("util")
const path = require("path")

const globPromise = util.promisify(glob)

class GameAssetPlugin {
	lastFiles = new Map()
	nextFiles = new Map()

	processFileList(key, list, compilation) {
		const modifiedFiles = compilation.compiler.modifiedFiles
		let trigger = false
		for (const relativePath of list) {
			const file = path.resolve(__dirname, relativePath)
			if (!this.lastFiles.has(file) || modifiedFiles.has(file)) {
				trigger = true
			}
			this.nextFiles.set(file, key)
			compilation.fileDependencies.add(file)
		}
		return trigger
	}

	apply(compiler) {
		compiler.hooks.emit.tapPromise("GameAssetPlugin", async compilation => {
			const tiles = await globPromise("./atlas/tiles/*.png")
			const options = {
				speech: this.processFileList("speech", await globPromise("./speech/*.@(json|txt)"), compilation),
				map: this.processFileList("map", await globPromise("./@(map|tileset)/*.json"), compilation),
				navmap: this.processFileList("navmap", tiles.filter(x => x.endsWith("-navmap.png")), compilation),
				atlas: this.processFileList("atlas", tiles.filter(x => !x.endsWith("-navmap.png")), compilation),
				fonts: this.processFileList("fonts", await globPromise("./fonts/*.fnt"), compilation)
			}
			if (compilation.compiler.removedFiles) {
				compilation.compiler.removedFiles.forEach(x => this.lastFiles.has(x) && (options[this.lastFiles.get(x)] = true))
			}
			compilation.contextDependencies.add(path.resolve(__dirname, "speech"))
			compilation.contextDependencies.add(path.resolve(__dirname, "map"))
			compilation.contextDependencies.add(path.resolve(__dirname, "tileset"))
			compilation.contextDependencies.add(path.resolve(__dirname, "atlas/tiles"))
			compilation.contextDependencies.add(path.resolve(__dirname, "fonts"))
			this.lastFiles = this.nextFiles
			this.nextFiles = new Map()
			if (Object.values(options).findIndex(x => x) >= 0) {
				try {
					await preprocess(options)
				} catch (e) {
					compilation.errors.push(e)
				}
			}
		})
	}
}

module.exports = GameAssetPlugin
