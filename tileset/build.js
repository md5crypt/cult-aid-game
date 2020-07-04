const jimp = require("jimp");
const glob = require("glob");
const fs = require("fs");
const path = require("path");

(async () => {
	glob.sync(path.resolve(__dirname, "*.png")).forEach(file => fs.unlinkSync(file));
	for (const file of glob.sync(path.resolve(__dirname, "../atlas/tiles") + "/*.png")) {
		const name = path.basename(file)
		const match = name.match(/^(.+?)(-fg+)?(?:-(\d+))?\.png$/)
		if (!match) {
			console.warn(`skipping ${name}`)
			continue
		}
		const [base, isFg, frame] = [match[1], !!match[2], match[3] == undefined ? undefined : parseInt(match[3], 10)]
		if ((base == "atlas") || frame || isFg) {
			continue;
		}
		const dest = path.resolve(__dirname, base + ".png")
		const fgFile = [
			path.resolve(__dirname, "../atlas/tiles", base + "-fg.png"),
			path.resolve(__dirname, "../atlas/tiles", base + "-fg-0000.png"),
		].filter(file => fs.existsSync(file))
		if (fgFile.length == 1) {
			await jimp.read(file)
				.then(async handle => handle.blit((await jimp.read(fgFile[0])), 0, 0))
				.then(handle => handle.write(dest))
			continue
		}
		fs.copyFileSync(file, dest);
	}
})()
