import { RectTileLayer } from "./RectTile/RectTileLayer"
import { GameData } from "./GameData"
import { GameContext } from "./GameContext"
import { Path, SimplePath } from "./Path"

const enum CONST {
	FALLBACK_DELAY = 100
}

export namespace Sprite {
	export class Basic implements Sprite {
		private texture: GameData.Texture
		constructor(texture: GameData.Texture) {
			this.texture = texture
		}
		public render(layer: RectTileLayer, x: number, y: number) {
			const texture = this.texture
			layer.addRect(0, texture.frame[0], texture.frame[1], x + texture.offset[0], y + texture.offset[1], texture.frame[2], texture.frame[3])
		}
	}

	export class Advanced implements Sprite {
		private textures: GameData.Texture[]
		private lastTime: number
		private frame: number
		private scale: number
		private delay: number
		private pivot: [number, number]
		private data: GameData.Sprite
		protected offset: [number, number]

		constructor(data: GameData.Sprite) {
			this.offset = [0, 0]
			if (!Array.isArray(data.layers.char)) {
				throw new Error(data.name)
			}
			this.textures = data.layers.char
			this.frame = 0
			this.lastTime = Math.floor(GameContext.time)
			this.scale = data.scale || 1
			this.pivot = data.pivot ? [data.pivot[0], data.pivot[1]] : [0, 0]
			this.delay = data.delay || CONST.FALLBACK_DELAY
			this.data = data
		}

		public setFrame(n: number) {
			this.frame = n
			this.lastTime = Math.floor(GameContext.time)
		}

		public setOffset(x: number, y: number) {
			this.offset[0] = x
			this.offset[1] = y
		}

		public loadData(data: GameData.Sprite) {
			if (this.data != data) {
				if (!Array.isArray(data.layers.char)) {
					throw new Error(data.name)
				}
				this.textures = data.layers.char
				this.frame = 0
				this.lastTime = Math.floor(GameContext.time)
				this.scale = data.scale || 1
				if (data.pivot) {
					this.pivot[0] = data.pivot[0]
					this.pivot[1] = data.pivot[1]
				} else {
					this.pivot[0] = 0
					this.pivot[1] = 0
				}
				this.delay = data.delay || CONST.FALLBACK_DELAY
				this.data = data
			}
		}

		public render(layer: RectTileLayer, x: number, y: number) {
			const steps = Math.floor((GameContext.time - this.lastTime) / this.delay)
			this.frame = (this.frame + steps) % this.textures.length
			this.lastTime += steps * this.delay
			const texture = this.textures[this.frame]
			layer.addRect(
				0,
				texture.frame[0],
				texture.frame[1],
				x + this.offset[0] + (texture.offset[0] - this.pivot[0]) * this.scale,
				y + this.offset[1] + (texture.offset[1] - this.pivot[1]) * this.scale,
				texture.frame[2],
				texture.frame[3],
				this.scale
			)
		}
	}

	export interface WalkSequence {
		idle: GameData.Sprite
		up: GameData.Sprite
		down: GameData.Sprite
		left: GameData.Sprite
		right: GameData.Sprite
	}

	export namespace WalkSequence {
		export function find(name: string): WalkSequence {
			return {
				idle: Sprite.find(name + "-idle"),
				up: Sprite.find(name + "-up"),
				down: Sprite.find(name + "-down"),
				left: Sprite.find(name + "-left"),
				right: Sprite.find(name + "-right")
			}
		}
	}

	export class Walking extends Advanced {
		private walkSequence: WalkSequence
		private position: number

		public constructor(walkSequence: WalkSequence) {
			super(walkSequence.idle)
			this.walkSequence = walkSequence
			this.position = -1
		}
	}

	export function find(name: string) {
		const sprite = GameContext.data.sprites.find(x => x.name == name)
		if (!sprite) {
			throw new Error(`sprite '${name}' not found`)
		}
		return sprite
	}
}

export interface Sprite {
	render(layer: RectTileLayer, x: number, y: number): void
}
