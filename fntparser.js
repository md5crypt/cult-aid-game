const fs = require("fs")

function buildFontData(input) {
	const data = parse(input)
	const kernings = new Map()
	const ligatures = new Map()
	if (data.kerning) {
		for (const kerning of data.kerning) {
			let glyph = kernings.get(kerning.first)
			if (!glyph) {
				glyph = []
				kernings.set(kerning.first, glyph)
			}
			glyph.push([kerning.second, kerning.amount])
		}
	}
	if (data.ligature) {
		for (const ligature of data.ligature) {
			let glyph = ligatures.get(ligature.sequence[0])
			if (!glyph) {
				glyph = []
				ligatures.set(ligature.sequence[0], glyph)
			}
			glyph.push({sequence: ligature.sequence.splice(1), id: ligature.id})
		}
		for (const array of ligatures.values()) {
			array.sort((a, b) => b.length - a.length)
		}
	}
	return {
		name: data.info.face,
		resource: data.page.file,
		lineHeight: data.common.lineHeight,
		data: data.char.map(char => {
			return {
				id: char.id,
				advance: char.xadvance,
				frame: (char.id == 32) ? [0, 0, 0, 0, 0, 0] : [
					char.x,
					char.y,
					char.width,
					char.height,
					char.xoffset,
					char.yoffset
				],
				ligatures: ligatures.get(char.id),
				kernings: kernings.get(char.id),
			}
		})
	}
}

function parse(data) {
	const re = /(?:(?<key>\w+)=(?:(?<array>(?:-?\d+,)+-?\d+)|(?<number>-?\d+)|(?:"(?<string>[^"]*)")))|(?<object>\w+)|(?<line>\n)|(?<ws>\s+)|(?<error>.+)/g
	let output = {}
	let object = null
	let line = 1
	while (true) {
		const match = re.exec(data)
		if (!match) {
			break
		}
		if (match.groups.key !== undefined) {
			if (match.groups.array !== undefined) {
				object[match.groups.key] = match.groups.array.split(",").map(x => parseInt(x, 10))
			} else if (match.groups.number !== undefined) {
				object[match.groups.key] = parseInt(match.groups.number, 10)
			} else {
				object[match.groups.key] = match.groups.string
			}
		} else if (match.groups.object !== undefined) {
			object = {}
			if (output[match.groups.object]) {
				if (!Array.isArray(output[match.groups.object])) {
					output[match.groups.object] = [output[match.groups.object]]
				}
				output[match.groups.object].push(object)
			} else {
				output[match.groups.object] = object
			}
		} else if (match.groups.line !== undefined) {
			line += 1
		} else if (match.groups.error !== undefined) {
			throw new Error(`fnt parse error, line: ${line}, text: ${match.groups.error}`)
		}
	}
	return output
}

module.exports = buildFontData
