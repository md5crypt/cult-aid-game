import { RectTileLayer } from "./RectTile/RectTileLayer"
import { GameData } from "./GameData"
import { Path, SimplePath, Direction } from "./Path"
import { modulo } from "./utils"
import { CONST } from "./Constants"
import { GameMap } from "./GameMap"
import { gameContext } from "./GameContext"
import { Animation } from "./Animation"
import { Listener } from "./Listener"

export namespace Sprite {
	export class Background implements Sprite {
		public readonly data: GameData.SpriteData
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
			const layers = gameContext.layers
			const data = this.data
			if (data.texture) {
				if (Array.isArray(data.texture)) {
					const frame = Math.floor(gameContext.time / (data.delay || CONST.FALLBACK_DELAY)) % data.texture.length
					Background.renderTexture(layers.bg, data.texture[frame], x, y)
				} else {
					Background.renderTexture(layers.bg, data.texture, x, y)
				}
			}
			if (data.fgTexture) {
				if (Array.isArray(data.fgTexture)) {
					const frame = Math.floor(gameContext.time / (data.delay || CONST.FALLBACK_DELAY)) % data.fgTexture.length
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
		private textures?: GameData.Texture[]
		private scale: number
		private delay: number
		private pivot: [number, number]
		private currentSpriteData?: GameData.SpriteData
		private _inView: boolean
		private _frame: number
		/** @internal */
		public _cell?: GameMap.Cell
		protected offset: [number, number]
		protected animation?: Animation
		protected path: Path[]
		protected direction?: Direction
		public readonly name: string
		public readonly userData: Record<string, any>
		public alwaysUpdate: boolean
		public onUpdate: Listener<Item>
		public onEnterView: Listener<Item>
		public onExitView: Listener<Item>

		constructor(data: GameData.SpriteData, name = "") {
			this.alwaysUpdate = false
			this.inView = false
			this.offset = [0, 0]
			this.textures = data.texture && (Array.isArray(data.texture) ? data.texture : [data.texture])
			this.path = []
			this.scale = data.scale || 1
			this.pivot = data.pivot ? [data.pivot[0], data.pivot[1]] : [0, 0]
			this.delay = data.delay || CONST.FALLBACK_DELAY
			this._inView = false
			this._frame = 0
			this.onUpdate = new Listener()
			this.onEnterView = new Listener()
			this.onExitView = new Listener()
			this.name = name || data.name
			this.userData = {}

			this.setTexture(data)

			if (data.scripts) {
				if (data.scripts.onUpdate) {
					const callback = gameContext.scripts.resolve(data.scripts.onUpdate, "itemUpdate")
					this.onUpdate.add((item) => callback(gameContext, item))
				}
				if (data.scripts.onEnterView) {
					const callback = gameContext.scripts.resolve(data.scripts.onUpdate, "itemEnterView")
					this.onEnterView.add((item) => callback(gameContext, item))
				}
				if (data.scripts.onExitView) {
					const callback = gameContext.scripts.resolve(data.scripts.onUpdate, "itemExitView")
					this.onExitView.add((item) => callback(gameContext, item))
				}
			}
		}

		public set inView(value: boolean) {
			if (!this._inView && value) {
				this._inView = true
				this.onEnterView.invoke(this)
			} else if (this._inView && !value) {
				this._inView = false
				this.onExitView.invoke(this)
			}
		}

		public get inView() {
			return this._inView
		}

		public set frame(frame: number) {
			if (!this.textures || (this.textures.length <= frame)) {
				throw new Error(`requested out of bounds frame ${frame} from sprite ${this.name}`)
			}
			this._frame = frame
		}

		public get frame() {
			return this._frame
		}

		public get moving() {
			return this.path.length > 0
		}

		public get cell() {
			if (!this._cell) {
				throw new Error(`item ${this.name} is not on the map`)
			}
			return this._cell
		}

		public setOffset(offset: number[]): void
		public setOffset(x: number, y: number): void
		public setOffset(arg1: any, arg2?: number) {
			if (arg2) {
				this.offset[0] = arg1
				this.offset[1] = arg2
			} else {
				this.offset[0] = arg1[0]
				this.offset[1] = arg1[1]
			}
		}

		public setAnimation(animation: Animation, data?: GameData.SpriteData) {
			this.animation = animation
			if (data) {
				this.setTexture(data, false)
			}
		}

		public clearAnimation(frame = 0) {
			this.animation = undefined
			this.frame = frame
		}

		public pushPath(path: Path) {
			this.path.push(path)
		}

		public clearPath(offset?: [number, number]) {
			this.path = []
			if (offset) {
				this.offset[0] = offset[0]
				this.offset[1] = offset[1]
			}
			this.directionChanged(undefined)
		}

		public setTexture(data: GameData.SpriteData, updateAnimation = true) {
			if (this.currentSpriteData != data) {
				this.currentSpriteData = data
				this.textures = data.texture && (Array.isArray(data.texture) ? data.texture : [data.texture])
				this.scale = data.scale || 1
				if (data.pivot) {
					this.pivot[0] = data.pivot[0]
					this.pivot[1] = data.pivot[1]
				} else {
					this.pivot[0] = 0
					this.pivot[1] = 0
				}
				this.delay = data.delay || CONST.FALLBACK_DELAY
				this.frame = 0
				if (updateAnimation) {
					if (this.textures && (this.textures.length > 1)) {
						this.animation = new Animation(data.animation || [["sequence", 0, this.textures.length - 1], ["loop"]])
					} else {
						this.animation = undefined
					}
				}
			}
		}

		public update(delta: number) {
			this.onUpdate.invoke(this)
			if (this.animation) {
				this.animation.update(delta, this.delay)
				this.frame = this.animation.frame
			}
			if (this.path.length > 0) {
				let diff = delta
				let path = this.path[0]
				while (true) {
					diff = path.update(diff)
					if (diff >= 0) {
						this.path.shift()
						this.offset[0] = path.x
						this.offset[1] = path.y
						path.onEnd.invoke(path)
						if (this.path.length > 0) {
							path = this.path[0]
							continue
						}
					}
					break
				}
				this.offset[0] = path.x
				this.offset[1] = path.y
				if (this.path.length == 0) {
					this.directionChanged(undefined)
				} else if (this.direction != path.direction) {
					this.directionChanged(path.direction)
				}
			}
		}

		protected directionChanged(direction: Direction | undefined) {
			this.direction = direction
		}

		public render(x: number, y: number) {
			if (!this.textures) {
				return
			}
			let texture = this.textures[this.frame]
			gameContext.layers.mid.addRect(
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
		protected moveDirection?: Direction
		public speed: number

		protected onCellChange(_prev: GameMap.Cell | null) {
		}

		public constructor(walkSequence: WalkSequence, speed = CONST.WALK_BASE_SPEED) {
			super(walkSequence.idle)
			this.walkSequence = walkSequence
			this.speed = speed
		}

		public enable(x: number, y: number, offset?: [number, number]) {
			this.clearPath()
			this.setTexture(this.walkSequence.idle)
			gameContext.map.getCell(x, y).addItem(this)
			this.onCellChange(null)
			if (offset) {
				this.setOffset(offset)
			} else {
				const center = this.cell.getCenter()
				if (!center) {
					throw new Error("can not place a Walking sprite on a tile without path data")
				}
				this.setOffset(center)
			}
		}

		public disable() {
			this.clearAnimation()
			this.clearPath()
			this.moveDirection = undefined
			this.cell.removeItem(this)
		}

		public setLocation(x: number, y: number, offset?: [number, number]) {
			const map = gameContext.map
			this.enable(modulo(x, map.tileWidth), modulo(y, map.tileHeight), offset)
		}

		public getAbsoluteLocation(): [number, number] {
			return [
				(this.cell.x * CONST.GRID_BASE) + this.offset[0],
				(this.cell.y * CONST.GRID_BASE) + this.offset[1]
			]
		}

		public walk(direction: Direction): Path | null {
			const map = gameContext.map
			const cell = this.cell
			const exitPath = cell.getExitPath(direction, this.offset[0], this.offset[1])
			if (!exitPath) {
				return null
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
			newX = modulo(cell.x + newX, map.tileWidth)
			newY = modulo(cell.y + newY, map.tileHeight)
			const newCell = map.getCell(newX, newY)
			const enterPath = newCell.getEnterPath(direction)
			if (!enterPath) {
				return null
			}
			const path1 = new SimplePath(exitPath, this.speed)
			path1.onEnd.add(() => {
				newCell.addItem(this)
				this.onCellChange(cell)
			})
			this.pushPath(path1)
			const path2 = new SimplePath(enterPath, this.speed)
			this.pushPath(path2)
			return path2
		}

		protected directionChanged(direction: Direction | undefined) {
			super.directionChanged(direction)
			this.setTexture(direction ? this.walkSequence[direction] :this.walkSequence.idle)
		}
	}

	const spriteCache: Map<string, GameData.SpriteData> = new Map()
	export function find(name: string): GameData.SpriteData
	export function find(name: string, noThrow: boolean): GameData.SpriteData | undefined
	export function find(name: string, noThrow = false) {
		if (spriteCache.size == 0) {
			gameContext.data.sprites.forEach(x => spriteCache.set(x.name, x))
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
