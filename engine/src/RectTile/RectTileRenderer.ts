import { RectTileShader } from "./RectTileShader"
import { Renderer, ObjectRenderer, Buffer, Texture, Geometry } from "@pixi/core"
import { createIndicesForQuads } from "@pixi/utils"

export class RectTileRenderer extends ObjectRenderer {
	public readonly indexBuffer: Buffer
	public readonly shader: RectTileShader
	public static MAX_TEXTURES = 4

	constructor(renderer: Renderer) {
		super(renderer)
		this.shader = new RectTileShader(RectTileRenderer.MAX_TEXTURES)
		this.indexBuffer = new Buffer(new ArrayBuffer(0), true, true)
		this.indexBuffer.update(createIndicesForQuads(256 * 256))
	}

	public createGeometry() {
		return new RectTileGeometry(this)
	}

	public bindTextures(renderer: Renderer, textures: Array<Texture>) {
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

export class RectTileGeometry extends Geometry {
	constructor(renderer: RectTileRenderer) {
		super()
		const buf = new Buffer(new Float32Array(CONST.VERT_PER_QUAD), true, false)
		this.addAttribute("aVertexPosition", buf, 0, false, 0, CONST.STRIDE, 0)
			.addAttribute("aTextureCoord", buf, 0, false, 0, CONST.STRIDE, 2 * 4)
			.addAttribute("aTextureId", buf, 0, false, 0, CONST.STRIDE, 4 * 4)
			.addIndex(renderer.indexBuffer)
	}
}

export const enum CONST {
	VERT_PER_QUAD = 5,
	STRIDE = VERT_PER_QUAD * 4,
}

Renderer.registerPlugin("rectTileRenderer", RectTileRenderer as any)
