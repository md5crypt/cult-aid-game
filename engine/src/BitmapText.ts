import { Sprite } from "./Sprite"
import { GameData } from "./GameData"
import { cssColorList } from "./Colors"
import { LayoutElement} from "./Layout"

export class BitmapText extends LayoutElement {

	private static readonly colors: Map<string, number> = new Map(cssColorList)

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

	public constructor(rect?: PIXI.Rectangle) {
		super(rect)
		this.interactiveChildren = false
	}

	public drawRichText(text: BitmapText.RichText, offset = 0) {
		if (offset >= text.words.length) {
			return text.words.length
		}
		if (this.height < text.lineHeight) {
			// nothing to do
			return offset
		}
		const lines: {words: BitmapText.RichText.Word[], width: number}[] = []
		let lineWidth = 0
		let textHeight = -text.lineSpacing
		let words: BitmapText.RichText.Word[] = []
		let index = offset
		while (true) {
			const word = text.words[index]
			const delta = word.width + (words.length ? text.whitespace : 0)
			if ((lineWidth + delta) <= this.width) {
				lineWidth += delta
				words.push(word)
			} else if (words.length) {
				lines.push({words, width: lineWidth})
				textHeight += text.lineHeight + text.lineSpacing
				words = []
				lineWidth = 0
				if (textHeight > this.height) {
					break
				}
				continue
			} else {
				break
			}
			index += 1
			if (index == text.words.length) {
				if (words) {
					lines.push({words, width: lineWidth})
					textHeight += text.lineHeight + text.lineSpacing
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

	public drawText(text: string, textOptions: BitmapText.TextOptions) {
		const options = BitmapText.TextOptions.resolve(textOptions)
		const data = options.font.resolve(text)
		const width = data.reduce((a, b) => a + b.advance, 0) * options.size
		let xOffset
		if ((options.xAlign == "center") && (this.width > width)) {
			xOffset = Math.floor((this.width - width) / 2)
		} else if ((options.xAlign == "right") && (this.width < width)) {
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
}

export namespace BitmapText {

	export interface TextOptions {
		font: string | Font
		lineSpacing?: number
		letterSpacing?: number
		wordSpacing?: number
		xAlign?: "left" | "right" | "center" | "justify"
		yAlign?: "top" | "bottom" | "middle"
		color?: number | string
		size?: number
	}

	export namespace TextOptions {
		export function resolve(options: BitmapText.TextOptions) {
			return {
				xAlign: "left",
				yAlign: "top",
				lineSpacing: 0,
				letterSpacing: 0,
				wordSpacing: 0,
				size: 1,
				...options,
				font: typeof options.font == "string" ? BitmapText.Font.get(options.font) : options.font,
				color: options.color ? BitmapText.resolveColor(options.color) : 0
			} as const
		}
	}

	type KerningData = readonly [number, number]

	interface LigatureData {
		readonly id: number
		readonly sequence: readonly number[]
	}

	interface FontCharData {
		readonly id: number
		readonly advance: number
		readonly frame: readonly [number, number, number, number]
		readonly offset: readonly [number, number]
		readonly ligatures?: readonly LigatureData[]
		readonly kernings?: readonly KerningData[]
	}

	export interface FontData {
		readonly name: string
		readonly sprite: string
		readonly lineHeight: number
		readonly data: readonly FontCharData[]
	}

	export interface TextCharInfo {
		advance: number
		texture: PIXI.Texture | null
	}

	interface InternalCharData extends TextCharInfo {
		kernings?: Map<number, number>
		ligatures?: readonly LigatureData[]
	}

	export class RichText {
		public readonly words: readonly RichText.Word[]
		public readonly lineHeight: number
		public readonly lineSpacing: number
		public readonly whitespace: number
		public readonly size: number
		public readonly xAlign: "left" | "right" | "center" | "justify"
		public readonly yAlign: "top" | "bottom" | "middle"

		constructor(text: string, textOptions: BitmapText.TextOptions) {
			const options = TextOptions.resolve(textOptions)
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
	}

	export namespace RichText {
		export interface Word {
			text: string
			color: number
			width: number
			data: BitmapText.TextCharInfo[]
		}

	}

	export class Font {
		private static readonly registeredFonts: Map<string, Font> = new Map()
		private readonly data: Map<number, InternalCharData>
		public readonly lineHeight: number

		public static register(font: FontData, baseTexture: PIXI.Texture, name?: string) {
			Font.registeredFonts.set(name || font.name, new Font(font, baseTexture))
		}

		public static unregister(name: string) {
			return Font.registeredFonts.delete(name)
		}

		public static get(name: string) {
			const font = Font.registeredFonts.get(name)
			if (!font) {
				throw new Error(`font '${font}' not found`)
			}
			return font
		}

		constructor(font: FontData, baseTexture: PIXI.Texture) {
			const sprite = Sprite.find(font.sprite)
			if (!sprite.texture || Array.isArray(sprite.texture)) {
				throw new Error(`can not create font from sprite ${font.sprite}`)
			}
			this.lineHeight = font.lineHeight
			this.data = new Map()
			for (const char of font.data) {
				// type asserts seem to be broken with readonly fields
				// hance the casts...
				const frame = (sprite.texture as GameData.Texture).frame
				const offset = (sprite.texture as GameData.Texture).offset
				const texture = frame[0] ? new PIXI.Texture(
					baseTexture.baseTexture,
					new PIXI.Rectangle(
						char.frame[0] + frame[0],
						char.frame[1] + frame[1],
						char.frame[2],
						char.frame[3],
					),
					new PIXI.Rectangle(
						0,
						0,
						char.frame[2] + offset[0] + char.offset[0],
						char.frame[3] + offset[1] + char.offset[1],
					),
					new PIXI.Rectangle(
						char.offset[0] + offset[0],
						char.offset[1] + offset[1],
						char.frame[2],
						char.frame[3],
					)
				) : null
				this.data.set(char.id, {
					texture,
					advance: char.advance,
					ligatures: char.ligatures,
					kernings: char.kernings && char.kernings.reduce(
						(a, b) => (a.set(b[0], b[1]), a), new Map<number, number>()
					)
				})
			}
			this.autoFill()
		}

		private autoFill() {
			const charPointA = "A".charCodeAt(0)
			const charPointZ = "Z".charCodeAt(0)
			const distance = "a".charCodeAt(0) - "A".charCodeAt(0)

			// infer uppercase from lowercase and lowercase from uppercase
			for (let id = charPointA; id < charPointZ; id++) {
				if (this.data.has(id) && !this.data.has(id + distance)) {
					this.data.set(id + distance, this.data.get(id)!)
				} else if (!this.data.has(id) && this.data.has(id + distance)) {
					this.data.set(id, this.data.get(id + distance)!)
				}
			}

			// if no '?' char (ascii 63) defined set it to a white square
			// '?' is used for undefined characters so it has to be defined
			if (!this.data.has(63)) {
				this.data.set(63, {texture: PIXI.Texture.WHITE, advance: 16})
			}

			// ignore new line character
			this.data.set(10, {texture: null, advance: 0})
		}

		public resolve(value: string) {
			const output: TextCharInfo[] = []
			for (let i = 0; i < value.length; i += 1) {
				let char = this.getChar(value.charCodeAt(i))
				if (char.ligatures) {
					for (const ligature of char.ligatures) {
						const sequence = ligature.sequence
						let match = true
						if ((i + sequence.length) < value.length) {
							for (let j = 0; j < sequence.length; j += 1) {
								if (value.charCodeAt(i + j + 1) != sequence[j]) {
									match = false
									break
								}
 							}
						}
						if (match) {
							char = this.getChar(ligature.id)
							i += sequence.length
							for (let i = 0; i < sequence.length; i += 1) {
								// keep it a one-to-one ratio
								output.push({texture: null, advance: 0})
							}
							break
						}
					}
				}
				let advance = char.advance
				if (char.kernings && ((i + 1) < value.length)) {
					advance += char.kernings.get(value.charCodeAt(i + 1)) || 0
				}
				output.push({texture: char.texture, advance})
			}
			return output
		}

		public getChar(id: number) {
			return this.data.get(id) || this.data.get(63)!
		}
	}
}
