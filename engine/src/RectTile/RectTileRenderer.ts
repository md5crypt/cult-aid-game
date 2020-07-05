import { RectTileShader } from "./RectTileShader"

export class RectTileRenderer extends PIXI.ObjectRenderer {
	public readonly indexBuffer: PIXI.Buffer
	public readonly shader: RectTileShader
	public static MAX_TEXTURES = 4

	constructor(renderer: PIXI.Renderer) {
		super(renderer)
		this.shader = new RectTileShader(RectTileRenderer.MAX_TEXTURES)
		this.indexBuffer = new PIXI.Buffer(new ArrayBuffer(0), true, true)
		this.indexBuffer.update(PIXI.utils.createIndicesForQuads(256 * 256))
	}

	public createGeometry() {
		return new RectTileRenderer.Geometry(this)
	}

	public bindTextures(renderer: PIXI.Renderer, textures: Array<PIXI.Texture>) {
		let samplerSize: number[] = []
		for (let i = 0; i < textures.length; i++) {
			const texture = textures[i]
			renderer.texture.bind(texture, i)
			samplerSize.push(
				texture.baseTexture.width,
				texture.baseTexture.height
			)
		}
		this.shader.uniforms.uSamplerSize = samplerSize
	}
}

export namespace RectTileRenderer {
	export const enum CONST {
		VERT_PER_QUAD = 5,
		STRIDE = VERT_PER_QUAD * 4,
	}
	export class Geometry extends PIXI.Geometry {
		constructor(renderer: RectTileRenderer) {
			super()
			const buf = new PIXI.Buffer(new Float32Array(CONST.VERT_PER_QUAD), true, false)
			this.addAttribute("aVertexPosition", buf, 0, false, 0, CONST.STRIDE, 0)
				.addAttribute("aTextureCoord", buf, 0, false, 0, CONST.STRIDE, 2 * 4)
				.addAttribute("aTextureId", buf, 0, false, 0, CONST.STRIDE, 4 * 4)
				.addIndex(renderer.indexBuffer)
		}
	}
}

PIXI.Renderer.registerPlugin("rectTileRenderer", RectTileRenderer as any)
