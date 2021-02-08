const jimp = require("jimp");
const glob = require("glob");
const fs = require("fs");
const path = require("path");

(async () => {
	glob.sync(path.resolve(__dirname, "*.png")).forEach(file => fs.unlinkSync(file));
	for (const file of glob.sync(path.resolve(__dirname, "../atlas/tiles") + "/*.png")) {
		const name = path.basename(file)
		const match = path.basename(file).match(/^(?<base>.+?)(?:-(?<type>fg|zone|navmap))?(?:_(?<frame>\d+))?\.png$/)
		if (!match) {
			console.warn(`skipping ${name}`)
			continue
		}
		groups = match.groups
		if (parseInt(groups.frame) > 0 || groups.type) {
			continue;
		}
		const dest = path.resolve(__dirname, groups.base + ".png")
		const blitList = [
			{ file: "-fg.png", alpha: 1 },
			{ file: "-fg-0000.png", alpha: 1 },
			{ file: "-navmap.png", alpha: 0.2 }
		].map(x => (x.file = path.resolve(__dirname, "../atlas/tiles", groups.base + x.file), x)).filter(x => fs.existsSync(x.file))
		if (blitList.length > 0) {
			const handle = await jimp.read(file)
			for (const source of blitList) { 
				const image = await jimp.read(source.file)
				handle.blit(image.opacity(source.alpha), 0, 0)
			}
			await handle.write(dest)
		} else {
			fs.copyFileSync(file, dest);
		}
	}
})()
