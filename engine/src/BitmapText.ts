import { Sprite } from "./Sprite"
import { GameData } from "./GameData"

export class BitmapText extends PIXI.Container {

	public setText(value: string, font: BitmapText.Font | string, tint = 0) {
		let offset = 0
		const fontData = typeof font == "string" ? BitmapText.Font.get(font) : font
		const data = fontData.resolve(value)
		this.removeChildren()
		for (const char of data) {
			if (char.texture) {
				const sprite = new PIXI.Sprite(char.texture)
				sprite.x = offset
				sprite.tint = tint
				this.addChild(sprite)
			}
			offset += char.advance
		}
	}
}

export namespace BitmapText {

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
						char.frame[3] + offset[1] + + char.offset[1],
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

			for (let id = charPointA; id < charPointZ; id++) {
				if (this.data.has(id) && !this.data.has(id + distance)) {
					this.data.set(id + distance, this.data.get(id)!)
				} else if (!this.data.has(id) && this.data.has(id + distance)) {
					this.data.set(id, this.data.get(id + distance)!)
				}
			}
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
			return this.data.get(id) || {texture: PIXI.Texture.WHITE, advance: 16}
		}
	}
}
