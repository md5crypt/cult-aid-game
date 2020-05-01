const jimp = require("jimp");
const glob = require("glob");
const fs = require("fs");
const path = require("path");

(async () => {
	glob.sync(path.resolve(__dirname, "*.png")).forEach(file => fs.unlinkSync(file));
	for (const file of glob.sync(path.resolve(__dirname, "../atlas") + "/*.png")) {
		const name = path.basename(file)
		const match = name.match(/^(.+?)-([^-]+)(?:-(\d+))?\.png$/)
		if (!match) {
			console.warn(`skipping ${name}`)
			continue
		}
		const [base, layer, frame] = [match[1], match[2], match[3] == undefined ? undefined : parseInt(match[3], 10)]
		if (frame || layer == "fg") {
			continue;
		}
		const dest = path.resolve(__dirname, base + ".png")
		if (layer == "bg") {
			const fgFile = [
				path.resolve(__dirname, "../atlas", base + "-bg.png"),
				path.resolve(__dirname, "../atlas", base + "-bg-0000.png"),
			].filter(file => fs.existsSync(file))
			if (fgFile.length == 1) {
				await jimp.read(file)
					.then(async handle => handle.blit((await jimp.read(fgFile[0])), 0, 0))
					.then(handle => handle.write(dest))
				continue
			}
		}
		fs.copyFileSync(file, dest);
	}
})()
