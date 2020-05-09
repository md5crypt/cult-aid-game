import { RectTileRenderer } from "./RectTileRenderer"

const enum CONST {
	VECTOR_BUFFER_INITIAL_SIZE = 128
}

export class RectTileLayer extends PIXI.Container {
	private textures: Array<PIXI.Texture>
	private buffer: Float32Array
	private offset: number
	private dirty: boolean
	private geometry: RectTileRenderer.Geometry | null

	constructor(textures: PIXI.Texture | PIXI.Texture[]) {
		super()
		this.textures = Array.isArray(textures) ? textures : [textures]
		this.buffer = new Float32Array(RectTileRenderer.CONST.STRIDE * CONST.VECTOR_BUFFER_INITIAL_SIZE)
		this.offset = 0
		this.geometry = null
		this.dirty = true
	}

	public clear() {
		this.dirty = true
		this.offset = 0
	}

	public addRect(texture: number, u: number, v: number, x: number, y: number, w: number, h: number, scale = 1) {
		const offset = this.offset
		let buffer = this.buffer
		if ((offset + RectTileRenderer.CONST.STRIDE) > buffer.length) {
			buffer = new Float32Array(this.buffer.length * 2)
			buffer.set(this.buffer)
			this.buffer = buffer
		}
		buffer[offset + 0] = x
		buffer[offset + 1] = y
		buffer[offset + 2] = u
		buffer[offset + 3] = v
		buffer[offset + 4] = u + 0.5
		buffer[offset + 5] = v + 0.5
		buffer[offset + 6] = u + (w - 0.5)
		buffer[offset + 7] = v + (h - 0.5)
		buffer[offset + 8] = texture
		buffer[offset + 9] = x + (w * scale)
		buffer[offset + 10] = y
		buffer[offset + 11] = u + w
		buffer[offset + 12] = v
		buffer[offset + 13] = u + 0.5
		buffer[offset + 14] = v + 0.5
		buffer[offset + 15] = u + (w - 0.5)
		buffer[offset + 16] = v + (h - 0.5)
		buffer[offset + 17] = texture
		buffer[offset + 18] = x + (w * scale)
		buffer[offset + 19] = y + (h * scale)
		buffer[offset + 20] = u + w
		buffer[offset + 21] = v + h
		buffer[offset + 22] = u + 0.5
		buffer[offset + 23] = v + 0.5
		buffer[offset + 24] = u + (w - 0.5)
		buffer[offset + 25] = v + (h - 0.5)
		buffer[offset + 26] = texture
		buffer[offset + 27] = x
		buffer[offset + 28] = y + (h * scale)
		buffer[offset + 29] = u
		buffer[offset + 30] = v + h
		buffer[offset + 31] = u + 0.5
		buffer[offset + 32] = v + 0.5
		buffer[offset + 33] = u + (w - 0.5)
		buffer[offset + 34] = v + (h - 0.5)
		buffer[offset + 35] = texture
		this.offset += RectTileRenderer.CONST.STRIDE
	}

	public render(renderer: PIXI.Renderer) {
		if (this.offset == 0) {
			return
		}
		const plugin = (renderer.plugins as any).rectTileRenderer as RectTileRenderer
		renderer.batch.setObjectRenderer(plugin)
		renderer.globalUniforms.uniforms.projectionMatrix
			.copyTo(plugin.shader.uniforms.projTransMatrix)
			.append(this.worldTransform)
		const rects = this.offset / RectTileRenderer.CONST.STRIDE
		plugin.bindTextures(renderer, this.textures)
		plugin.resizeIndexBuffer(rects)
		renderer.shader.bind(plugin.shader, false)
		if (this.geometry == null) {
			this.geometry = new RectTileRenderer.Geometry(plugin)
			this.dirty = true
		}
		if (this.dirty) {
			this.geometry.getBuffer("aVertexPosition").update(this.buffer.subarray(0, this.offset))
			this.dirty = false
		}
		renderer.geometry.bind(this.geometry, plugin.shader)
		renderer.geometry.draw(PIXI.DRAW_MODES.TRIANGLES, rects * 6, 0)
	}

	public destroy(options?: any) {
		super.destroy(options)
		if (this.geometry) {
			this.geometry.destroy()
			this.geometry = null
		}
	}
}
