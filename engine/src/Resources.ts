export const enum FRAME {
	x,
	y,
	w,
	h,
	left,
	top,
	right,
	bottom,
	base
}

export type TextureFrame = readonly number[] | readonly number[][]

export class TextureStorage {
	public readonly baseTextures: PIXI.Texture[]

	private textures: Map<string, PIXI.Texture | PIXI.Texture[]>
	private frames: Map<string, TextureFrame>

	public constructor(frames: Record<string, TextureFrame>, baseTextures: PIXI.Texture[]) {
		this.baseTextures = baseTextures
		this.textures = new Map()
		this.frames = new Map()
		for (let key in frames) {
			this.frames.set(key, frames[key])
		}
	}

	public getFrame(resource: string, noThrow?: false): TextureFrame
	public getFrame(resource: string, noThrow: true): TextureFrame | undefined
	public getFrame(resource: string, noThrow = false) {
		const frame = this.frames.get(resource)
		if (!frame && !noThrow) {
			throw new Error(`resource '${resource}' not found`)
		}
		return frame
	}

	private createTexture(frame: readonly number[]) {
		return new PIXI.Texture(
			this.baseTextures[frame[FRAME.base]].baseTexture,
			new PIXI.Rectangle(
				frame[FRAME.x],
				frame[FRAME.y],
				frame[FRAME.w],
				frame[FRAME.h]
			),
			new PIXI.Rectangle(
				0,
				0,
				frame[FRAME.w] + frame[FRAME.left] + frame[FRAME.right],
				frame[FRAME.h] + frame[FRAME.top] + frame[FRAME.bottom]
			),
			new PIXI.Rectangle(
				frame[FRAME.left],
				frame[FRAME.top],
				frame[FRAME.w],
				frame[FRAME.h]
			)
		)
	}

	public getTexture(resource: string, flat?: true): PIXI.Texture
	public getTexture(resource: string, flat: false): PIXI.Texture | PIXI.Texture[]
	public getTexture(resource: string, flat = true) {
		let result = this.textures.get(resource)
		if (!result) {
			const frame = this.getFrame(resource)
			if (typeof frame[0] == "number") {
				result = this.createTexture(frame as readonly number[])
			} else {
				result = (frame as readonly number[][]).map(x => this.createTexture(x))
			}
			this.textures.set(resource, result)
		}
		return (!flat && Array.isArray(result)) ? result[0] : result
	}
}
