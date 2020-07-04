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
				this.onCreate = gameContext.scripts.resolve(data.onCreate, "cellCreate")
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
				frame[FRAME.h]
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
		protected path: Path[]
		protected direction?: Direction
		public readonly name: string
		public readonly userData: Record<string, any>
		public readonly timer: ScriptTimer
		public onUpdate: Listener<Item>
		public onEnterView: Listener<Item>
		public onExitView: Listener<Item>
		/** @internal */
		public paint: number
		public zIndex: number

		public static create(sprite: string, name?: string) {
			return new Item(Sprite.find(sprite), name)
		}

		public static createFromItemData(data: GameData.ItemData) {
			const sprite = Sprite.find(data.sprite)
			const merged = {...sprite, ...data}
			const item = new Item(merged, data.name)
			gameContext.map.getCell(data.cell[0], data.cell[1]).addItem(item)
			if (data.offset) {
				item.setOffset(data.offset)
			}
			if (merged.onCreate) {
				const callback = gameContext.scripts.resolve(merged.onCreate, "itemCreate")
				void callback(item)
			}
			return item
		}

		constructor(data: GameData.SpriteData, name = "") {
			if (data.resource) {
				const frame = gameContext.textures.tiles.getFrame(data.resource)
				this.textures = (Array.isArray(frame[0]) ? frame : [frame]) as number[][]
			}
			this.offset = [0, 0]
			this.path = []
			this.scale = data.scale || 1
			this.pivot = data.pivot ? [data.pivot[0], data.pivot[1]] : [0, 0]
			this._alwaysUpdate = false
			this._inView = false
			this._frame = 0
			this.onUpdate = new Listener()
			this.onEnterView = new Listener()
			this.onExitView = new Listener()
			this.paint = 0
			this.zIndex = data.zIndex || 0
			this.name = name || data.name || data.resource || "anonymous"
			this.userData = {}
			this.timer = new ScriptTimer()

			this.setTexture(data)

			if (data.onUpdate) {
				const callback = gameContext.scripts.resolve(data.onUpdate, "itemUpdate")
				this.onUpdate.add(item => callback(item))
			}
			if (data.onEnterView) {
				const callback = gameContext.scripts.resolve(data.onEnterView, "itemEnterView")
				this.onEnterView.add(item => callback(item))
			}
			if (data.onExitView) {
				const callback = gameContext.scripts.resolve(data.onExitView, "itemExitView")
				this.onExitView.add(item => callback(item))
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

		public get moving() {
			return this.path.length > 0
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

		public setAnimation(animation: Animation) {
			this.animation = animation
			return animation
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

		public setTexture(data: GameData.SpriteData, animation?: Animation | null) {
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
				this.pivot[1] = 0
			}
			this.animation = undefined
			this.frame = 0
			if ((animation === undefined) && this.textures && (this.textures.length > 1)) {
				this.animation = new Animation(
					data.animation || [["sequence", 0, this.textures.length - 1], ["loop"]],
					data.delay
				)
			} else if (animation) {
				this.animation = animation
			}
		}

		/** @internal */
		public update(delta: number) {
			this.onUpdate.invoke(this)
			if (this.animation) {
				this.animation.update(delta)
				this.frame = this.animation.frame
			}
			if (this.path.length > 0) {
				const path = Path.updateArray(delta, this.path, this.offset)
				if (this.path.length == 0) {
					this.directionChanged(undefined)
				} else if (this.direction != path.direction) {
					this.directionChanged(path.direction)
				}
			}
			this.timer.update(delta)
		}

		protected directionChanged(direction: Direction | undefined) {
			this.direction = direction
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

	export class MovableItem extends Item {
		public readonly walkSequence: WalkSequence
		private preventWalkSequenceChange: boolean
		public speed: number

		protected onCellChange(_prev: GameMap.Cell | null) {
		}

		public constructor(walkSequence: WalkSequence, speed = CONST.WALK_BASE_SPEED) {
			super(walkSequence.idle)
			this.walkSequence = walkSequence
			this.speed = speed
			this.preventWalkSequenceChange = false
		}

		public setTexture(data: GameData.SpriteData, animation?: Animation | null) {
			this.preventWalkSequenceChange = true
			super.setTexture(data, animation)
		}

		public clearAnimation(frame = 0) {
			this.preventWalkSequenceChange = true
			super.clearAnimation(frame)
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
			this.cell.removeItem(this)
		}

		public setLocation(x: number, y: number, offset?: [number, number]) {
			const map = gameContext.map
			this.enable(modulo(x, map.tileWidth), modulo(y, map.tileHeight), offset)
		}

		public canWalk(direction: Direction): boolean {
			return (
				!!this.cell.getExitPath(direction, this.offset[0], this.offset[1]) &&
				!!this.cell.getNeighbor(direction).getEnterPath(direction)
			)
		}

		public walk(direction: Direction): Path | null {
			const cell = this.cell
			const exitPath = cell.getExitPath(direction, this.offset[0], this.offset[1])
			if (!exitPath) {
				return null
			}
			const newCell = this.cell.getNeighbor(direction)
			const enterPath = newCell.getEnterPath(direction)
			if (!enterPath) {
				return null
			}
			const path1 = new SimplePath(exitPath, this.speed)
			path1.onEnd.add(() => {
				newCell.addItem(this)
				this.onCellChange(cell)
			})
			this.preventWalkSequenceChange = false
			this.pushPath(path1)
			const path2 = new SimplePath(enterPath, this.speed)
			this.pushPath(path2)
			return path2
		}

		public waitWalkEnd() {
			if (this.path.length == 0) {
				return Promise.resolve()
			}
			return new Promise(resolve => this.path[this.path.length - 1].onEnd.add(resolve))
		}

		protected directionChanged(direction: Direction | undefined) {
			super.directionChanged(direction)
			if (!this.preventWalkSequenceChange) {
				super.setTexture(direction ? this.walkSequence[direction] :this.walkSequence.idle)
			}
			this.preventWalkSequenceChange = false
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
