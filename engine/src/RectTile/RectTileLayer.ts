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

	public addRect(texture: number, u: number, v: number, x0: number, y0: number, w: number, h: number, scale = 1) {
		const offset = this.offset
		let buffer = this.buffer
		if ((offset + RectTileRenderer.CONST.STRIDE) > buffer.length) {
			buffer = new Float32Array(this.buffer.length * 2)
			buffer.set(this.buffer)
			this.buffer = buffer
		}
		const u0 = u + (1/1024)
		const v0 = v + (1/1024)
		const u1 = u + w - (1/1024)
		const v1 = v + h - (1/1024)
		const x1 = x0 + (w * scale)
		const y1 = y0 + (h * scale)
		buffer[offset + 0] = x0
		buffer[offset + 1] = y0
		buffer[offset + 2] = u0
		buffer[offset + 3] = v0
		buffer[offset + 4] = texture
		buffer[offset + 5] = x1
		buffer[offset + 6] = y0
		buffer[offset + 7] = u1
		buffer[offset + 8] = v0
		buffer[offset + 9] = texture
		buffer[offset + 10] = x1
		buffer[offset + 11] = y1
		buffer[offset + 12] = u1
		buffer[offset + 13] = v1
		buffer[offset + 14] = texture
		buffer[offset + 15] = x0
		buffer[offset + 16] = y1
		buffer[offset + 17] = u0
		buffer[offset + 18] = v1
		buffer[offset + 19] = texture
		this.offset += RectTileRenderer.CONST.STRIDE
	}

	public render(renderer: PIXI.Renderer) {
		if (this.offset == 0) {
			return
		}
		const plugin = renderer.plugins.rectTileRenderer as RectTileRenderer
		renderer.batch.setObjectRenderer(plugin)
		renderer.globalUniforms.uniforms.projectionMatrix
			.copyTo(plugin.shader.uniforms.projTransMatrix)
			.append(this.worldTransform)
		plugin.bindTextures(renderer, this.textures)
		renderer.shader.bind(plugin.shader, false)
		if (this.geometry == null) {
			this.geometry = plugin.createGeometry()
			this.dirty = true
		}
		if (this.dirty) {
			this.geometry.getBuffer("aVertexPosition").update(this.buffer.subarray(0, this.offset))
			this.dirty = false
		}
		renderer.geometry.bind(this.geometry, plugin.shader)
		renderer.geometry.draw(PIXI.DRAW_MODES.TRIANGLES, (this.offset / RectTileRenderer.CONST.STRIDE) * 6, 0)
	}

	public destroy(options?: any) {
		super.destroy(options)
		if (this.geometry) {
			this.geometry.destroy()
			this.geometry = null
		}
	}
}
