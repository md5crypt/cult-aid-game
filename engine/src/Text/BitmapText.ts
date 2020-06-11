import { BitmapFont, TextCharInfo } from "./BitmapFont"
import { cssColorList } from "./Colors"

export interface TextOptions {
	font: string | BitmapFont
	lineSpacing?: number
	letterSpacing?: number
	wordSpacing?: number
	xAlign?: "left" | "right" | "center" | "justify"
	yAlign?: "top" | "bottom" | "middle"
	color?: number | string
	size?: number
}

function resolveTextOptions(options: TextOptions) {
	return {
		xAlign: "left",
		yAlign: "top",
		lineSpacing: 0,
		letterSpacing: 0,
		wordSpacing: 0,
		size: 1,
		...options,
		font: typeof options.font == "string" ? BitmapFont.get(options.font) : options.font,
		color: options.color ? BitmapText.resolveColor(options.color) : 0
	} as const
}

export class BitmapText extends PIXI.Container {
	private static readonly colors: Map<string, number> = new Map(cssColorList)
	private _width = 0
	private _height = 0

	public set width(value: number) {
		this._width = value
	}

	public get width() {
		return this._width
	}

	public set height(value: number) {
		this._height = value
	}

	public get height() {
		return this._height
	}

	public static registerColor(name: string, value: number) {
		BitmapText.colors.set(name.toLowerCase(), value)
	}

	public static resolveColor(value: string | number) {
		if (typeof value == "number") {
			return value
		}
		if (value[0] == "#") {
			return parseInt(value.slice(1), 16)
		}
		const color = this.colors.get(value.toLowerCase())
		if (color === undefined) {
			throw new Error(`color '${value}' not found`)
		}
		return color
	}

	public drawRichText(text: RichText, offset = 0) {
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
			const delta = word.width + (words.length ? text.whitespace : 0)
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
		this.removeChildren()
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
				justifyQuotient = Math.floor((this.width - line.width) / (line.words.length - 1))
				justifyReminder = (this.width - line.width) % (line.words.length - 1)
			} else {
				xOffset = 0
			}
			for (const word of line.words) {
				for (const char of word.data) {
					if (char.texture) {
						const sprite = new PIXI.Sprite(char.texture)
						sprite.x = xOffset
						sprite.y = yOffset
						sprite.scale.set(text.size)
						sprite.tint = word.color
						this.addChild(sprite)
					}
					xOffset += char.advance * text.size
				}
				xOffset += text.whitespace + justifyQuotient + (justifyReminder ? 1 : 0)
				if (justifyReminder > 0) {
					justifyReminder -= 1
				}
			}
			yOffset += text.lineHeight + text.lineSpacing
		}
		return index
	}

	public measureText(text: string, textOptions: TextOptions) {
		const options = resolveTextOptions(textOptions)
		const data = options.font.resolve(text)
		const width = data.reduce((a, b) => a + b.advance, 0) * options.size
		return [width, width ? options.font.lineHeight : 0] as [number, number]
	}

	public drawText(text: string, textOptions: TextOptions) {
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
				const sprite = new PIXI.Sprite(char.texture)
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

	public static createRichText(text: string, textOptions: TextOptions) {
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

	constructor(text: string, textOptions: TextOptions) {
		const options = resolveTextOptions(textOptions)
		const re = /(?:\[(\w+)(?:=([^\]]+))?\])|(?:\[\/(\w+)\])|([\s]+)|([^\s\[]+)/g
		const color = [options.color]
		const words: RichText.Word[] = []
		let match = re.exec(text)
		while (match) {
			if (match[1] !== undefined) {
				// bb tag start
				if (match[1] != "color") {
					throw new Error(`unknown bb tag '${match[0]}' in '${text}'`)
				}
				if (match[2] === undefined) {
					throw new Error(`no color provided in '${match[0]}' in '${text}'`)
				}
				color.push(BitmapText.resolveColor(match[2]))
			} else if (match[3] !== undefined) {
				// bb tag end
				if (match[3] != "color") {
					throw new Error(`unknown bb tag '${match[0]}' in '${text}'`)
				}
				if (color.length <= 1) {
					throw new Error(`invalid bb tag '${match[0]}' in '${text}'`)
				}
				color.pop()
			} else if (match[4] !== undefined) {
				// whitespace (ignore)
			} else if (match[5] !== undefined) {
				// text
				const word = match[5]
				const data = options.font.resolve(word)
				data.forEach(char => char.advance += options.letterSpacing)
				words.push({
					text: word,
					width: data.reduce((a, b) => a + b.advance, 0) * options.size,
					color: color[color.length - 1],
					data
				})
			} else {
				console.log(match)
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
			const delta = word.width + (lineWidth ? this.whitespace : 0)
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
	}
}
