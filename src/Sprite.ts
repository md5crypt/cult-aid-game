import { RectTileLayer } from "./RectTile/RectTileLayer"
import { GameData } from "./GameData"
import { GameContext } from "./GameContext"
import { Path, SimplePath } from "./Path"
import { modulo } from "./utils"
import { CONST } from "./Constants"
import { GameMap } from "./GameMap"

export namespace Sprite {
	export class Background implements Sprite {
		private data: GameData.SpriteData
		private plugs?: (Background | undefined)[]

		private static cache: Map<GameData.SpriteData, Background> = new Map()

		public static create(data: GameData.SpriteData) {
			let sprite = Background.cache.get(data)
			if (!sprite) {
				sprite = new Background(data)
				Background.cache.set(data, sprite)
			}
			return sprite
		}

		private static createPlug(name: string) {
			const data = Sprite.find(name, true)
			return data ? Background.create(data) : undefined
		}

		private constructor(data: GameData.SpriteData) {
			this.data = data
			if (data.plugGroup) {
				this.plugs = [
					Background.createPlug(data.plugGroup + "-plug-up"),
					Background.createPlug(data.plugGroup + "-plug-down"),
					Background.createPlug(data.plugGroup + "-plug-left"),
					Background.createPlug(data.plugGroup + "-plug-right")
				]
			}
		}

		public renderPlugs(x: number, y: number, state: number) {
			if (this.plugs) {
				if ((state & Background.Plug.UP) && this.plugs[0]) {
					this.plugs[0].render(x, y)
				}
				if ((state & Background.Plug.DOWN) && this.plugs[1]) {
					this.plugs[1].render(x, y)
				}
				if ((state & Background.Plug.LEFT) && this.plugs[2]) {
					this.plugs[2].render(x, y)
				}
				if ((state & Background.Plug.RIGHT) && this.plugs[3]) {
					this.plugs[3].render(x, y)
				}
			}
		}

		public render(x: number, y: number) {
			const layers = GameContext.layers
			const data = this.data
			if (data.texture) {
				if (Array.isArray(data.texture)) {
					const frame = Math.floor(GameContext.time / (data.delay || CONST.FALLBACK_DELAY)) % data.texture.length
					Background.renderTexture(layers.bg, data.texture[frame], x, y)
				} else {
					Background.renderTexture(layers.bg, data.texture, x, y)
				}
			}
			if (data.fgTexture) {
				if (Array.isArray(data.fgTexture)) {
					const frame = Math.floor(GameContext.time / (data.delay || CONST.FALLBACK_DELAY)) % data.fgTexture.length
					Background.renderTexture(layers.fg, data.fgTexture[frame], x, y)
				} else {
					Background.renderTexture(layers.fg, data.fgTexture, x, y)
				}
			}
		}

		private static renderTexture(layer: RectTileLayer, texture: GameData.Texture, x: number, y: number) {
			layer.addRect(
				0,
				texture.frame[0],
				texture.frame[1],
				x + texture.offset[0],
				y + texture.offset[1],
				texture.frame[2],
				texture.frame[3]
			)
		}
	}

	export namespace Background {
		export const enum Plug {
			UP = 1,
			DOWN = 2,
			LEFT = 4,
			RIGHT = 8
		}
	}

	export class Item implements Sprite {
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
			if (!Array.isArray(data.texture)) {
				throw new Error(data.name)
			}
			this.textures = data.texture
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
				if (!Array.isArray(data.texture)) {
					throw new Error(data.name)
				}
				this.textures = data.texture
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

		public render(x: number, y: number) {
			const layers = GameContext.layers
			const steps = Math.floor((GameContext.time - this.lastRender) / this.delay)
			this.frame = (this.frame + steps) % this.textures.length
			this.lastRender += steps * this.delay
			const texture = this.textures[this.frame]
			layers.mid.addRect(
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

	export class Character extends Item {
		private walkSequence: WalkSequence
		protected cell: GameMap.Cell | null
		private pathStack: Path[]
		private cellStack: GameMap.Cell[]
		private lastUpdate: number
		public speed: number

		public isMoving() {
			return this.pathStack.length != 0
		}

		protected onCellChange(_prev: GameMap.Cell | null) {
		}

		public constructor(walkSequence: WalkSequence, speed = CONST.WALK_BASE_SPEED) {
			super(walkSequence.idle)
			this.walkSequence = walkSequence
			this.cell = null
			this.pathStack = []
			this.cellStack = []
			this.speed = speed
			this.lastUpdate = 0
		}

		public enable(x: number, y: number, offset?: [number, number]) {
			this.setSpriteData(this.walkSequence.idle)
			this.cell = GameContext.map.getCell(x, y)
			this.cell.addItem(this)
			this.onCellChange(null)
			if (offset) {
				this.offset[0] = offset[0]
				this.offset[1] = offset[1]
			} else {
				const center = this.cell.getCenter()
				if (!center) {
					throw new Error("can not place a Walking sprite on a tile without path data")
				}
				this.offset[0] = center[0]
				this.offset[1] = center[1]
			}
			this.lastUpdate = GameContext.time
		}

		public disable() {
			if (this.cell) {
				if (this.pathStack.length != 0) {
					this.pathStack = []
				}
				if (this.cellStack.length != 0) {
					this.cellStack = []
				}
				const cell = this.cell
				cell.removeItem(this)
				this.cell = null
				this.onCellChange(cell)
			}
		}

		public setLocation(x: number, y: number, offset?: [number, number]) {
			this.disable()
			const map = GameContext.map
			this.enable(modulo(x, map.tileWidth), modulo(y, map.tileHeight), offset)
		}

		public getAbsoluteLocation(): [number, number] {
			if (this.cell == null) {
				throw new Error("called getAbsoluteLocation on disabled sprite")
			}
			return [
				(this.cell.x * CONST.GRID_BASE) + this.offset[0],
				(this.cell.y * CONST.GRID_BASE) + this.offset[1]
			]
		}

		public walk(direction: "up" | "down" | "left" | "right") {
			if (!this.cell || (this.pathStack.length != 0)) {
				return false
			}
			const map = GameContext.map
			const exitPath = this.cell.getExitPath(direction, this.offset[0], this.offset[1])
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
			newX = modulo(this.cell.x + newX, map.tileWidth)
			newY = modulo(this.cell.y + newY, map.tileHeight)
			const newCell = map.getCell(newX, newY)
			const enterPath = newCell.getEnterPath(direction)
			if (!enterPath) {
				return false
			}
			this.cellStack.push(newCell)
			this.pathStack.push(
				new SimplePath(enterPath, this.speed),
				new SimplePath(exitPath, this.speed)
			)
			this.setSpriteData(this.walkSequence[this.pathStack[1].direction])
			return true
		}

		public update(time: number) {
			if (!this.cell) {
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
					const prevCell = this.cell
					this.cell.removeItem(this)
					this.cell = this.cellStack.pop()!
					this.cell.addItem(this)
					this.onCellChange(prevCell)
				}
			}
			this.lastUpdate = time
		}
	}

	const spriteCache: Map<string, GameData.SpriteData> = new Map()
	export function find(name: string): GameData.SpriteData
	export function find(name: string, noThrow: boolean): GameData.SpriteData | undefined
	export function find(name: string, noThrow = false) {
		if (spriteCache.size == 0) {
			GameContext.data.sprites.forEach(x => spriteCache.set(x.name, x))
		}
		const sprite = spriteCache.get(name)
		if (!sprite && !noThrow) {
			throw new Error(`sprite '${name}' not found`)
		}
		return sprite
	}
}

export interface Sprite {
	render(x: number, y: number): void
}
