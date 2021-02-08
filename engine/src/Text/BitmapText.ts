import { BitmapFont, TextCharInfo } from "./BitmapFont"
import { BitmapTextOptions } from "./BitmapTextOptions"
import { Colors } from "../Colors"
import { Container } from "@pixi/display"
import { Sprite } from "@pixi/sprite"

function resolveTextOptions(options: BitmapTextOptions) {
	return {
		xAlign: "left",
		yAlign: "top",
		lineSpacing: 0,
		letterSpacing: 0,
		wordSpacing: 0,
		size: 1,
		...options,
		font: BitmapFont.get(options.font || "default"),
		color: Colors.resolve(options.color === undefined ? "default" : options.color)
	} as const
}

export class BitmapText extends Container {
	private computedWidth = 0
	private computedHeight = 0

	public set width(value: number) {
		this.computedWidth = value
	}

	public get width() {
		return this.computedWidth
	}

	public set height(value: number) {
		this.computedHeight = value
	}

	public get height() {
		return this.computedHeight
	}

	public drawRichText(text: RichText, offset = 0) {
		this.removeChildren()
		if (offset >= text.words.length) {
			return text.words.length
		}
		if (this.height < text.lineHeight) {
			// nothing to do
			return offset
		}
		const lines: {words: RichText.Word[], width: number}[] = []
		let lineWidth = 0
		let textHeight = text.lineHeight
		let words: RichText.Word[] = []
		let index = offset
		while (true) {
			const word = text.words[index]
			const delta = word.width + (words.length && !word.noSpace ? text.whitespace : 0)
			if ((lineWidth + delta) <= this.width) {
				lineWidth += delta
				words.push(word)
			} else if (words.length) {
				lines.push({words, width: lineWidth})
				words = []
				lineWidth = 0
				const newHeight = textHeight + text.lineHeight + text.lineSpacing
				if (newHeight > this.height) {
					break
				}
				textHeight = newHeight
				continue
			} else {
				break
			}
			index += 1
			if (index == text.words.length) {
				if (words) {
					lines.push({words, width: lineWidth})
				}
				break
			}
		}
		if (lines.length == 0) {
			// nothing to do
			return index
		}
		let yOffset
		if (text.yAlign == "middle") {
			yOffset = Math.floor((this.height - textHeight) / 2)
		} else if (text.yAlign == "bottom") {
			yOffset = this.height - textHeight
		} else {
			yOffset = 0
		}
		for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
			const line = lines[lineNumber]
			let xOffset
			let justifyQuotient = 0
			let justifyReminder = 0
			if (text.xAlign == "center") {
				xOffset = Math.floor((this.width - line.width) / 2)
			} else if (text.xAlign == "right") {
				xOffset = this.width - line.width
			} else if (text.xAlign == "justify" && ((lineNumber + 1) != lines.length)) {
				xOffset = 0
				const count = line.words.filter(x => !x.noSpace).length - 1
				justifyQuotient = Math.floor((this.width - line.width) / count)
				justifyReminder = (this.width - line.width) % count
			} else {
				xOffset = 0
			}
			for (const word of line.words) {
				for (const char of word.data) {
					if (char.texture) {
						const sprite = new Sprite(char.texture)
						sprite.x = xOffset
						sprite.y = yOffset
						sprite.scale.set(text.size)
						sprite.tint = word.color
						this.addChild(sprite)
					}
					xOffset += char.advance * text.size
				}
				if (!word.noSpace) {
					xOffset += text.whitespace + justifyQuotient + (justifyReminder ? 1 : 0)
					if (justifyReminder > 0) {
						justifyReminder -= 1
					}
				}
			}
			yOffset += text.lineHeight + text.lineSpacing
		}
		return index
	}

	public measureText(text: string, textOptions: BitmapTextOptions) {
		const options = resolveTextOptions(textOptions)
		const data = options.font.resolve(text)
		const width = data.reduce((a, b) => a + b.advance, 0) * options.size
		return [width, width ? options.font.lineHeight : 0] as [number, number]
	}

	public drawText(text: string, textOptions: BitmapTextOptions) {
		const options = resolveTextOptions(textOptions)
		const data = options.font.resolve(text)
		const width = data.reduce((a, b) => a + b.advance, 0) * options.size
		let xOffset
		if ((options.xAlign == "center") && (this.width > width)) {
			xOffset = Math.floor((this.width - width) / 2)
		} else if ((options.xAlign == "right") && (this.width > width)) {
			xOffset = this.width - width
		} else {
			xOffset = 0
		}
		const lineHeight = options.font.lineHeight * options.size
		let yOffset
		if ((options.yAlign == "middle") && (this.height > lineHeight)) {
			yOffset = Math.floor((this.height - lineHeight) / 2)
		} else if ((options.yAlign == "bottom") && (this.height < lineHeight)) {
			yOffset = this.height - lineHeight
		} else {
			yOffset = 0
		}
		this.removeChildren()
		for (const char of data) {
			if (char.texture) {
				const sprite = new Sprite(char.texture)
				sprite.x = xOffset
				sprite.y = yOffset
				sprite.scale.set(options.size)
				sprite.tint = options.color
				this.addChild(sprite)
			}
			xOffset += char.advance * options.size
		}
		return width
	}

	public static createRichText(text: string, textOptions: BitmapTextOptions) {
		return new RichText(text, textOptions)
	}
}

export class RichText {
	public readonly words: readonly RichText.Word[]
	public readonly lineHeight: number
	public readonly lineSpacing: number
	public readonly whitespace: number
	public readonly size: number
	public readonly xAlign: "left" | "right" | "center" | "justify"
	public readonly yAlign: "top" | "bottom" | "middle"

	constructor(text: string, textOptions: BitmapTextOptions) {
		const options = resolveTextOptions(textOptions)
		const re = /(?:\[(\w+)(?:=([^\]]+))?\])|(?:\[\/(\w+)\])|([\s]+)|([^\s\[]+)/g
		const color = [options.color]
		const words: RichText.Word[] = []
		let match = re.exec(text)
		let noSpace = false
		while (match) {
			if (match[1] !== undefined) {
				// bb tag start
				if (match[1] != "color") {
					throw new Error(`unknown bb tag '${match[0]}' in '${text}'`)
				}
				if (match[2] === undefined) {
					throw new Error(`no color provided in '${match[0]}' in '${text}'`)
				}
				color.push(Colors.resolve(match[2]))
			} else if (match[3] !== undefined) {
				// bb tag end
				if (match[3] != "color") {
					throw new Error(`unknown bb tag '${match[0]}' in '${text}'`)
				}
				if (color.length <= 1) {
					throw new Error(`invalid bb tag '${match[0]}' in '${text}'`)
				}
				noSpace = true
				color.pop()
			} else if (match[4] !== undefined) {
				noSpace = false
				// whitespace (ignore)
			} else if (match[5] !== undefined) {
				// text
				if (noSpace && words.length) {
					words[words.length - 1].noSpace = true
				}
				const word = match[5]
				const data = options.font.resolve(word)
				data.forEach(char => char.advance += options.letterSpacing)
				words.push({
					text: word,
					width: data.reduce((a, b) => a + b.advance, 0) * options.size,
					color: color[color.length - 1],
					noSpace: false,
					data
				})
				noSpace = false
			} else {
				console.error(match)
				throw new Error("I apparently messed up the regular expression")
			}
			match = re.exec(text)
		}
		this.words = words
		this.lineHeight = (options.font.lineHeight * options.size)
		this.whitespace = (options.font.getChar(32).advance * options.size) + options.wordSpacing
		this.xAlign = options.xAlign
		this.yAlign = options.yAlign
		this.size = options.size
		this.lineSpacing = options.lineSpacing
	}

	public measure(width = Infinity, height = Infinity, offset = 0): [number, number] {
		if (height < this.lineHeight) {
			return [0, 0]
		}
		let lineWidth = 0
		let rectHeight = this.lineHeight
		let rectWidth = 0
		for (let i = offset; i < this.words.length; i += 1) {
			const word = this.words[i]
			const delta = word.width + (lineWidth && !word.noSpace ? this.whitespace : 0)
			if ((lineWidth + delta) <= width) {
				lineWidth += delta
			} else if (lineWidth) {
				rectWidth = Math.max(rectWidth, lineWidth)
				lineWidth = 0
				const newHeight = rectHeight + this.lineHeight + this.lineSpacing
				if (newHeight > height) {
					break
				}
				rectHeight = newHeight
				continue
			} else {
				break
			}
		}
		if (lineWidth) {
			rectWidth = Math.max(rectWidth, lineWidth)
		}
		return [rectWidth, rectWidth ? rectHeight : 0]
	}
}

export namespace RichText {
	export interface Word {
		text: string
		color: number
		width: number
		data: TextCharInfo[]
		noSpace: boolean
	}
}
