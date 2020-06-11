import { TextureStorage, FRAME } from "../Resources"

interface InternalCharData extends TextCharInfo {
	kernings?: Map<number, number>
	ligatures?: readonly LigatureData[]
}

type KerningData = readonly [number, number]

interface LigatureData {
	readonly id: number
	readonly sequence: readonly number[]
}

interface FontCharData {
	readonly id: number
	readonly advance: number
	readonly frame: readonly number[]
	readonly ligatures?: readonly LigatureData[]
	readonly kernings?: readonly KerningData[]
}

export interface FontData {
	readonly name: string
	readonly resource: string
	readonly lineHeight: number
	readonly data: readonly FontCharData[]
}

export interface TextCharInfo {
	advance: number
	texture: PIXI.Texture | null
}

export class BitmapFont {
	private static readonly registeredFonts: Map<string, BitmapFont> = new Map()
	private readonly data: Map<number, InternalCharData>
	public readonly lineHeight: number

	public static register(font: FontData, textureStorage: TextureStorage) {
		BitmapFont.registeredFonts.set(name || font.name, new BitmapFont(font, textureStorage))
	}

	public static unregister(name: string) {
		return BitmapFont.registeredFonts.delete(name)
	}

	public static get(name: string) {
		const font = BitmapFont.registeredFonts.get(name)
		if (!font) {
			throw new Error(`font '${name}' not found`)
		}
		return font
	}

	constructor(font: FontData, textureStorage: TextureStorage) {
		const texture = textureStorage.getTexture(font.resource)
		this.lineHeight = font.lineHeight
		this.data = new Map()
		if ((texture.trim.x != 0) || (texture.trim.y != 0)) {
			throw new Error(`failed to load font '${font.name}': source texture can not be trimmed`)
		}
		for (const char of font.data) {
			const frame = char.frame
			const character = frame[FRAME.w] ? new PIXI.Texture(
				texture.baseTexture,
				new PIXI.Rectangle(
					frame[FRAME.x] + texture.frame.x,
					frame[FRAME.y] + texture.frame.y,
					frame[FRAME.w],
					frame[FRAME.h]
				),
				new PIXI.Rectangle(
					0,
					0,
					frame[FRAME.w] + frame[FRAME.left],
					frame[FRAME.h] + frame[FRAME.top]
				),
				new PIXI.Rectangle(
					frame[FRAME.left],
					frame[FRAME.top],
					frame[FRAME.w],
					frame[FRAME.h]
				)
			) : null
			this.data.set(char.id, {
				texture: character,
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
