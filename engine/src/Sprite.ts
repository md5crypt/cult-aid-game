import { RectTileLayer } from "./RectTile/RectTileLayer"
import { GameData } from "./GameData"
import { Path, SimplePath, Direction } from "./Path"
import { modulo } from "./utils"
import { CONST } from "./Constants"
import { GameMap } from "./GameMap"
import { gameContext } from "./GameContext"
import { Animation } from "./Animation"
import { Listener } from "./Listener"
import { ScriptTimer } from "./ScriptTimer"
import { ScriptStorage } from "./ScriptStorage"
import { FRAME, TextureFrame } from "./Resources"
import { PathFinder } from "./PathFinder"

export namespace Sprite {
	export class Background implements Sprite {
		public readonly data: GameData.SpriteData
		public readonly onCreate?: ScriptStorage.cellStaticCallback
		private plugs?: (Background | undefined)[]
		private texture?: TextureFrame
		private fgTexture?: TextureFrame

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
			if (data.resource) {
				this.texture = gameContext.textures.tiles.getFrame(data.resource, true)
				this.fgTexture = gameContext.textures.tiles.getFrame(data.resource + "-fg", true)
			}
			if (data.plugs) {
				this.plugs = data.plugs.map(x => Background.createPlug(x))
			}
			if (data.onCreate) {
				this.onCreate = gameContext.scripts.resolveOrThrow("cellCreate", data.onCreate)
			}
		}

		/** @internal */
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

		/** @internal */
		public render(x: number, y: number) {
			const layers = gameContext.layers
			if (this.texture) {
				if (Array.isArray(this.texture[0])) {
					const frame = Math.floor(gameContext.time / (this.data.delay || CONST.FALLBACK_DELAY)) % this.texture.length
					Background.renderTexture(layers.bg, this.texture[frame] as number[], x, y)
				} else {
					Background.renderTexture(layers.bg, this.texture as number[], x, y)
				}
			}
			if (this.fgTexture) {
				if (Array.isArray(this.fgTexture[0])) {
					const frame = Math.floor(gameContext.time / (this.data.delay || CONST.FALLBACK_DELAY)) % this.fgTexture.length
					Background.renderTexture(layers.fg, this.fgTexture[frame] as number[], x, y)
				} else {
					Background.renderTexture(layers.fg, this.fgTexture as number[], x, y)
				}
			}
		}

		private static renderTexture(layer: RectTileLayer, frame: readonly number[], x: number, y: number) {
			layer.addRect(
				frame[FRAME.base],
				frame[FRAME.x],
				frame[FRAME.y],
				x + frame[FRAME.left],
				y + frame[FRAME.top],
				frame[FRAME.w],
				frame[FRAME.h],
				1,
				false
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
		private textures?: readonly number[][]
		private scale: number
		private pivot: [number, number]
		private _inView: boolean
		private _frame: number
		private _alwaysUpdate: boolean
		/** @internal */
		public _cell?: GameMap.Cell
		protected offset: [number, number]
		protected animation?: Animation

		public readonly name: string
		public readonly timer: ScriptTimer
		public onUpdate: Listener<Item>
		public onEnterView: Listener<Item>
		public onExitView: Listener<Item>
		public flipped: boolean
		/** @internal */
		public paint: number
		public zIndex: number
		public enabled: boolean

		public static create(sprite: string, name?: string) {
			return new Item(Sprite.find(sprite), name)
		}

		public static createFromItemData(data: GameData.ItemData) {
			const sprite = Sprite.find(data.sprite)
			const merged = {...sprite, ...data}
			const item = new Item(merged, data.name)
			gameContext.map.getCell(
				Math.floor(data.position[0] / CONST.GRID_BASE),
				Math.floor(data.position[1] / CONST.GRID_BASE)
			).addItem(item)
			item.setOffset(data.position[0] % CONST.GRID_BASE, data.position[1] % CONST.GRID_BASE)
			if (data.flipped) {
				item.flipped = true
			}
			if (data.enabled !== undefined) {
				item.enabled = data.enabled
			}
			if (merged.onCreate) {
				const callback = gameContext.scripts.resolveOrThrow("itemCreate", merged.onCreate)
				void callback(item)
			}
			return item
		}

		constructor(data: GameData.SpriteData, name = "") {
			if (data.resource) {
				const frame = gameContext.textures.tiles.getFrame(data.resource)
				this.textures = (Array.isArray(frame[0]) ? frame : [frame]) as number[][]
			}
			this.enabled = true
			this.offset = [0, 0]
			this.scale = data.scale || 1
			this.pivot = [0, 0]
			this._alwaysUpdate = false
			this._inView = false
			this._frame = 0
			this.onUpdate = new Listener()
			this.onEnterView = new Listener()
			this.onExitView = new Listener()
			this.paint = 0
			this.zIndex = data.zIndex || 0
			this.flipped = false
			this.name = name || data.name || data.resource || "anonymous"
			this.timer = new ScriptTimer()

			this.setTexture(data)

			if (data.onUpdate) {
				this.onUpdate.add(gameContext.scripts.resolveOrThrow("itemUpdate", data.onUpdate))
			}
			if (data.onEnterView) {
				this.onEnterView.add(gameContext.scripts.resolveOrThrow("itemEnterView", data.onEnterView))
			}
			if (data.onExitView) {
				this.onExitView.add(gameContext.scripts.resolveOrThrow("itemExitView", data.onExitView))
			}
		}

		public get alwaysUpdate() {
			return this._alwaysUpdate
		}

		public set alwaysUpdate(value: boolean) {
			if (value) {
				this._alwaysUpdate = true
				gameContext.map.alwaysActiveList.add(this)
			} else {
				this._alwaysUpdate = true
				gameContext.map.alwaysActiveList.delete(this)
			}
		}

		/** @internal */
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

		public get cell() {
			if (!this._cell) {
				throw new Error(`item ${this.name} is not on the map`)
			}
			return this._cell
		}

		public setOffset(offset: readonly number[]): void
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

		public setAnimation(animation: Animation | Animation.Definition) {
			this.animation = animation instanceof Animation ? animation : new Animation(animation)
			return this.animation
		}

		public clearAnimation(frame = 0) {
			this.animation = undefined
			this.frame = frame
		}

		public setTexture(data: GameData.SpriteData, animation?: Animation | Animation.Definition |  null) {
			if (data.resource) {
				const frame = gameContext.textures.tiles.getFrame(data.resource)
				this.textures = (Array.isArray(frame[0]) ? frame : [frame]) as number[][]
			}
			this.scale = data.scale || 1
			if (data.pivot) {
				this.pivot[0] = data.pivot[0]
				this.pivot[1] = data.pivot[1]
			} else {
				this.pivot[0] = 0
				this.pivot[1] = this.textures ? this.textures[0][FRAME.h] : 0
			}
			this.animation = undefined
			this.frame = 0
			if ((animation === undefined) && this.textures && (this.textures.length > 1)) {
				this.animation = new Animation(
					data.animation || [["sequence", 0, this.textures.length - 1], ["loop"]],
					data.delay
				)
			} else if (animation) {
				this.animation = animation instanceof Animation ? animation : new Animation(animation)
			}
		}

		/** @internal */
		public update(delta: number) {
			this.onUpdate.invoke(this)
			if (this.animation) {
				this.animation.update(delta)
				this.frame = this.animation.frame
			}
			this.timer.update(delta)
		}

		public getAbsoluteLocation(): [number, number] {
			const cell = this.cell
			return [
				(cell.x * CONST.GRID_BASE) + this.offset[0],
				(cell.y * CONST.GRID_BASE) + this.offset[1]
			]
		}

		/** @internal */
		public render(x: number, y: number) {
			if (!this.textures) {
				return
			}
			let frame = this.textures[this.frame]
			gameContext.layers.mid.addRect(
				frame[FRAME.base],
				frame[FRAME.x],
				frame[FRAME.y],
				x + this.offset[0] + (frame[FRAME.left] - this.pivot[0]) * this.scale,
				y + this.offset[1] + (frame[FRAME.top] - this.pivot[1]) * this.scale,
				frame[FRAME.w],
				frame[FRAME.h],
				this.scale,
				this.flipped
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

	export class MovableItem extends Item {
		public readonly walkSequence: WalkSequence
		public speed: number
		protected vector: [number, number]
		protected moving: boolean

		protected onCellChange(_prev: GameMap.Cell | null, direction?: Direction) {
		}

		public constructor(walkSequence: WalkSequence, speed = CONST.WALK_BASE_SPEED) {
			super(walkSequence.idle)
			this.walkSequence = walkSequence
			this.speed = speed
			this.vector = [0, 0]
			this.moving = false
		}

		public setVector(x: number, y: number) {
			if (this.vector[0] == x && this.vector[1] == y) {
				return
			}
			this.vector[0] = x
			this.vector[1] = y
			super.setTexture(this.walkSequence[(["up", "left", "idle", "right", "down"] as const)[(x + y * 2) + 2]])
			this.moving = x != 0 || y != 0
		}

		public moveBy(dx: number, dy: number) {
			const newX = this.offset[0] + dx
			const newY = this.offset[1] + dy
			const cell = this._cell!.getCellContainingPoint(Math.floor(newX), Math.floor(newY))
			if (cell != this._cell) {
				const oldCell = this._cell!
				cell.addItem(this)
				this.onCellChange(oldCell, dx != 0 ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"))
				this.offset[0] = modulo(newX, CONST.GRID_BASE)
				this.offset[1] = modulo(newY, CONST.GRID_BASE)
			} else {
				this.offset[0] = newX
				this.offset[1] = newY
			}
		}

		public update(delta: number) {
			super.update(delta)
			if (this.moving) {
				const scalar = delta * (this.speed / CONST.WALK_SPEED_SCALE)
				for (let queryDelta = Math.ceil(scalar); queryDelta > 0; queryDelta -= 1) {
					const queryResponse = PathFinder.query(
						this.cell,
						Math.floor(this.offset[0]),
						Math.floor(this.offset[1]),
						this.vector[0] * queryDelta,
						this.vector[1] * queryDelta
					)
					if (queryResponse) {
						const norm = Math.sqrt(queryResponse[0] * queryResponse[0] + queryResponse[1] * queryResponse[1])
						if (norm > scalar + 0.001) {
							const scaledX = queryResponse[0] * scalar / norm
							const scaledY = queryResponse[1] * scalar / norm
							if (this.cell.isPointTraversable(Math.floor(this.offset[0] + scaledX), Math.floor(this.offset[1] + scaledY))) {
								this.moveBy(scaledX, scaledY)
								break
							}
						} else {
							this.moveBy(queryResponse[0], queryResponse[1])
							break
						}
					}
				}
			}
		}

		public enable(cell: GameMap.Cell, offset: readonly [number, number]) {
			this.setTexture(this.walkSequence.idle)
			cell.addItem(this)
			this.onCellChange(null)
			this.setOffset(offset)
		}

		public disable() {
			this.clearAnimation()
			this.cell.removeItem(this)
		}
	}

	const spriteCache: Map<string, GameData.SpriteData> = new Map()
	export function find(name: string): GameData.SpriteData
	export function find(name: string, noThrow: boolean): GameData.SpriteData | undefined
	export function find(name: string, noThrow = false) {
		if (spriteCache.size == 0) {
			for (const sprite of gameContext.data.sprites) {
				const name = sprite.name || sprite.resource
				if (name) {
					spriteCache.set(name, sprite)
				}
			}
		}
		const sprite = spriteCache.get(name)
		if (!sprite && !noThrow) {
			throw new Error(`sprite '${name}' not found`)
		}
		return sprite
	}
}

export interface Sprite {
	/** @internal */
	render(x: number, y: number): void
}
