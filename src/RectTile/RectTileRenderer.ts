import { RectTileShader } from "./RectTileShader"

export class RectTileRenderer extends PIXI.ObjectRenderer {
	public readonly indexBuffer: PIXI.Buffer
	public readonly shader: RectTileShader
	public static MAX_TEXTURES = 16
	private indexBufferSize: number

	constructor(renderer: PIXI.Renderer) {
		super(renderer)
		this.shader = new RectTileShader(RectTileRenderer.MAX_TEXTURES)
		this.indexBuffer = new PIXI.Buffer(new ArrayBuffer(0), true, true)
		this.indexBufferSize = 1
		this.resizeIndexBuffer(1024)
	}

	public bindTextures(renderer: PIXI.Renderer, textures: Array<PIXI.Texture>) {
		let samplerSize: number[] = []
		for (let i = 0; i < textures.length; i++) {
			const texture = textures[i]
			if (!texture || !texture.valid) {
				throw new Error()
			}
			renderer.texture.bind(texture, i)
			samplerSize.push(
				1.0 / texture.baseTexture.width,
				1.0 / texture.baseTexture.height
			)
		}
		this.shader.uniforms.uSamplerSize = samplerSize
	}

	public resizeIndexBuffer(size: number) {
		const required = size * 6
		if (required > this.indexBufferSize) {
			while ((size * 6) >= this.indexBufferSize) {
				this.indexBufferSize *= 2
			}
			this.indexBuffer.update(PIXI.utils.createIndicesForQuads(this.indexBufferSize))
		}
	}

	public destroy() {
		super.destroy();
		(this.shader as any) = null
	}
}

export namespace RectTileRenderer {
	export const enum CONST {
		VERT_PER_QUAD = 9,
		STRIDE = VERT_PER_QUAD * 4,
	}
	export class Geometry extends PIXI.Geometry {
		constructor(renderer: RectTileRenderer) {
			super()
			const buf = new PIXI.Buffer(new Float32Array(CONST.VERT_PER_QUAD), true, false)
			this.addAttribute("aVertexPosition", buf, 0, false, 0, CONST.STRIDE, 0)
				.addAttribute("aTextureCoord", buf, 0, false, 0, CONST.STRIDE, 2 * 4)
				.addAttribute("aFrame", buf, 0, false, 0, CONST.STRIDE, 4 * 4)
				.addAttribute("aTextureId", buf, 0, false, 0, CONST.STRIDE, 8 * 4)
				.addIndex(renderer.indexBuffer)
		}
	}
}

PIXI.Renderer.registerPlugin("rectTileRenderer", RectTileRenderer as any)
