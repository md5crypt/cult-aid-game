import { RectTileLayer } from "./RectTile/RectTileLayer"
import { GameData } from "./GameData"
import { GameContext } from "./GameContext"
import { Path, SimplePath } from "./Path"
import { modulo } from "./utils"
import { CONST } from "./Constants"

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
		private lastRender: number
		private frame: number
		private scale: number
		private delay: number
		private pivot: [number, number]
		private data: GameData.SpriteData
		protected offset: [number, number]

		constructor(data: GameData.SpriteData) {
			this.offset = [0, 0]
			if (!Array.isArray(data.layers.char)) {
				throw new Error(data.name)
			}
			this.textures = data.layers.char
			this.frame = 0
			this.lastRender = Math.floor(GameContext.time)
			this.scale = data.scale || 1
			this.pivot = data.pivot ? [data.pivot[0], data.pivot[1]] : [0, 0]
			this.delay = data.delay || CONST.FALLBACK_DELAY
			this.data = data
		}

		public setFrame(n: number) {
			this.frame = n
			this.lastRender = Math.floor(GameContext.time)
		}

		public setOffset(x: number, y: number) {
			this.offset[0] = x
			this.offset[1] = y
		}

		public setSpriteData(data: GameData.SpriteData) {
			if (this.data != data) {
				if (!Array.isArray(data.layers.char)) {
					throw new Error(data.name)
				}
				this.textures = data.layers.char
				this.frame = 0
				this.lastRender = Math.floor(GameContext.time)
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

		public render(layer: RectTileLayer, x: number, y: number, time: number) {
			const steps = Math.floor((time - this.lastRender) / this.delay)
			this.frame = (this.frame + steps) % this.textures.length
			this.lastRender += steps * this.delay
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
		idle: GameData.SpriteData
		up: GameData.SpriteData
		down: GameData.SpriteData
		left: GameData.SpriteData
		right: GameData.SpriteData
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
		private position: [number, number]
		private enabled: boolean
		private pathStack: Path[]
		private positionStack: number[][]
		private lastUpdate: number
		public speed: number

		public isMoving() {
			return this.pathStack.length != 0
		}

		public constructor(walkSequence: WalkSequence, speed = CONST.WALK_BASE_SPEED) {
			super(walkSequence.idle)
			this.walkSequence = walkSequence
			this.position = [0, 0]
			this.enabled = false
			this.pathStack = []
			this.positionStack = []
			this.speed = speed
			this.lastUpdate = 0
		}

		public enable(x: number, y: number, offset?: [number, number]) {
			this.position[0] = x
			this.position[1] = y
			this.enabled = true
			this.setSpriteData(this.walkSequence.idle)
			const cell = GameContext.map.getCell(x, y)
			cell.addItem(this)
			if (offset) {
				this.offset[0] = offset[0]
				this.offset[1] = offset[1]
			} else {
				if (!cell.paths) {
					throw new Error("can not place a Walking sprite on a tile without path data")
				}
				const path = cell.paths.up || cell.paths.down || cell.paths.left || cell.paths.right!
				const point = path[path.length - 1]
				this.offset[0] = point[0]
				this.offset[1] = point[1]
			}
			this.lastUpdate = GameContext.time
		}

		public disable() {
			if (this.enabled) {
				this.enabled = false
				if (this.pathStack.length != 0) {
					this.pathStack = []
				}
				if (this.positionStack.length != 0) {
					this.positionStack = []
				}
				GameContext.map.getCell(this.position[0], this.position[1]).removeItem(this)
			}
		}

		public setLocation(x: number, y: number, offset?: [number, number]) {
			this.disable()
			const map = GameContext.map
			this.enable(modulo(x, map.tileWidth), modulo(y, map.tileHeight), offset)
		}

		public getAbsoluteLocation(): [number, number] {
			return [
				(this.position[0] * CONST.GRID_BASE) + this.offset[0],
				(this.position[1] * CONST.GRID_BASE) + this.offset[1]
			]
		}

		public walk(direction: "up" | "down" | "left" | "right") {
			if (!this.enabled || (this.pathStack.length != 0)) {
				return false
			}
			const map = GameContext.map
			const exitPath = map
				.getCell(this.position[0], this.position[1])
				.getExitPath(direction, this.offset[0], this.offset[1])
			if (!exitPath) {
				return false
			}
			let newX = 0
			let newY = 0
			switch (direction) {
				case "up":
					newY = -1
					break
				case "down":
					newY = 1
					break
				case "left":
					newX = -1
					break
				case "right":
					newX = 1
					break
			}
			newX = modulo(this.position[0] + newX, map.tileWidth)
			newY = modulo(this.position[1] + newY, map.tileHeight)
			const enterPath = map
				.getCell(newX, newY)
				.getEnterPath(direction)
			if (!enterPath) {
				return false
			}
			this.positionStack.push([newX, newY])
			this.pathStack.push(
				new SimplePath(enterPath, this.speed),
				new SimplePath(exitPath, this.speed)
			)
			this.setSpriteData(this.walkSequence[this.pathStack[1].direction])
			return true
		}

		public update(time: number) {
			if (!this.enabled) {
				return
			}
			if (this.pathStack.length) {
				let delta = time - this.lastUpdate
				while (true) {
					const path = this.pathStack[this.pathStack.length - 1]
					delta = path.update(delta)
					if (delta < 0) {
						this.offset[0] = path.x
						this.offset[1] = path.y
						this.setSpriteData(this.walkSequence[path.direction])
						break
					}
					this.pathStack.pop()
					if (this.pathStack.length == 0) {
						this.offset[0] = path.x
						this.offset[1] = path.y
						this.setSpriteData(this.walkSequence.idle)
						break
					}
					GameContext.map.getCell(this.position[0], this.position[1]).removeItem(this)
					this.position = this.positionStack.pop() as [number, number]
					GameContext.map.getCell(this.position[0], this.position[1]).addItem(this)
				}
			}
			this.lastUpdate = time
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
	render(layer: RectTileLayer, x: number, y: number, time: number): void
}
