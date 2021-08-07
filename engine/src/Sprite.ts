import { RectTileLayer } from "./RectTile/RectTileLayer"
import { GameDataSprite, GameDataItem } from "./GameData"
import { Path, SimplePath } from "./Path"
import { modulo } from "./utils"
import { CONST } from "./Constants"
import { GameMapCell } from "./GameMap"
import { gameContext } from "./GameContext"
import { Animation, AnimationDefinition } from "./Animation"
import { Listener } from "./Listener"
import { ScriptTimer } from "./ScriptTimer"
import { FRAME, TextureFrame } from "./Resources"
import { MovementSmoother } from "./MovementSmoother"
import { PathFinder } from "./PathFinder"

export abstract class Sprite {
	private static spriteCache: Map<string, GameDataSprite> = new Map()

	public static find(name: string): GameDataSprite
	public static find(name: string, noThrow: boolean): GameDataSprite | undefined
	public static find(name: string, noThrow = false) {
		if (this.spriteCache.size == 0) {
			for (const sprite of gameContext.data.sprites) {
				if (sprite.resource) {
					this.spriteCache.set(sprite.resource, sprite)
				}
			}
		}
		const sprite = this.spriteCache.get(name)
		if (!sprite && !noThrow) {
			throw new Error(`sprite '${name}' not found`)
		}
		return sprite
	}

	/** @internal */
	public abstract render(x: number, y: number): void
}


export class BackgroundSprite implements Sprite {
	public readonly data: GameDataSprite
	private plugs?: (BackgroundSprite | undefined)[]
	private texture?: TextureFrame
	private fgTexture?: TextureFrame

	private static cache: Map<GameDataSprite, BackgroundSprite> = new Map()

	public static create(data: GameDataSprite) {
		let sprite = this.cache.get(data)
		if (!sprite) {
			sprite = new this(data)
			this.cache.set(data, sprite)
		}
		return sprite
	}

	private static createPlug(name: string) {
		const data = Sprite.find(name, true)
		return data ? this.create(data) : undefined
	}

	private constructor(data: GameDataSprite) {
		this.data = data
		if (data.resource) {
			this.texture = gameContext.textures.tiles.getFrame(data.resource, true)
			this.fgTexture = gameContext.textures.tiles.getFrame(data.resource + "-fg", true)
		}
		if (data.plugs) {
			this.plugs = data.plugs.map(x => BackgroundSprite.createPlug(x))
		}
	}

	/** @internal */
	public renderPlugs(x: number, y: number, state: number) {
		if (this.plugs) {
			if ((state & BackgroundSpritePlug.UP) && this.plugs[0]) {
				this.plugs[0].render(x, y)
			}
			if ((state & BackgroundSpritePlug.DOWN) && this.plugs[1]) {
				this.plugs[1].render(x, y)
			}
			if ((state & BackgroundSpritePlug.LEFT) && this.plugs[2]) {
				this.plugs[2].render(x, y)
			}
			if ((state & BackgroundSpritePlug.RIGHT) && this.plugs[3]) {
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
				BackgroundSprite.renderTexture(layers.bg, this.texture[frame] as number[], x, y)
			} else {
				BackgroundSprite.renderTexture(layers.bg, this.texture as number[], x, y)
			}
		}
		if (this.fgTexture) {
			if (Array.isArray(this.fgTexture[0])) {
				const frame = Math.floor(gameContext.time / (this.data.delay || CONST.FALLBACK_DELAY)) % this.fgTexture.length
				BackgroundSprite.renderTexture(layers.fg, this.fgTexture[frame] as number[], x, y)
			} else {
				BackgroundSprite.renderTexture(layers.fg, this.fgTexture as number[], x, y)
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

export const enum BackgroundSpritePlug {
	UP = 1,
	DOWN = 2,
	LEFT = 4,
	RIGHT = 8
}

export class ItemSprite implements Sprite {
	private textures?: readonly number[][]
	private scale: number
	private pivot: [number, number]
	private _inView: boolean
	private _frame: number
	private _alwaysUpdate: boolean
	private zOffset: number
	/** @internal */
	public _cell?: GameMapCell
	protected offset: [number, number]
	protected animation?: Animation
	protected currentTexture?: GameDataSprite

	public readonly name: string
	public readonly timer: ScriptTimer
	public onUpdate: Listener<ItemSprite>
	public onEnterView: Listener<ItemSprite>
	public onExitView: Listener<ItemSprite>
	public flipped: boolean
	/** @internal */
	public paint: number
	public enabled: boolean

	public static create(sprite: string, name?: string) {
		return new this(Sprite.find(sprite), name)
	}

	public static createFromItemData(data: GameDataItem) {
		const sprite = Sprite.find(data.sprite)
		const item = new this(sprite, data.name, data.class)
		if (data.zOffset) {
			item.zOffset = data.zOffset
		}
		if (data.flipped) {
			item.flipped = true
		}
		if (data.enabled !== undefined) {
			item.enabled = data.enabled
		}
		if (data.animation) {
			item.setAnimation(data.animation)
		}
		gameContext.map.getCell(
			Math.floor(data.position[0] / CONST.GRID_BASE),
			Math.floor(data.position[1] / CONST.GRID_BASE)
		).addItem(item)
		item.offset[0] = data.position[0] % CONST.GRID_BASE
		item.offset[1] = data.position[1] % CONST.GRID_BASE
		return item
	}

	constructor(data: GameDataSprite, name?: string, classList?: string[]) {
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
		this.zOffset = data.zOffset || 0
		this.flipped = false
		this.name = name ||data.resource || "anonymous"
		this.timer = new ScriptTimer()
		this.setTexture(data)
		gameContext.scripts.resolveAll("itemUpdate", this.onUpdate, name, classList)
		gameContext.scripts.resolveAll("itemEnterView", this.onEnterView, name, classList)
		gameContext.scripts.resolveAll("itemExitView", this.onExitView, name, classList)
	}

	public get zIndex() {
		return this._cell!.y * CONST.GRID_BASE + this.offset[1] + this.zOffset
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

	public setAnimation(animation: Animation | AnimationDefinition) {
		this.animation = animation instanceof Animation ? animation : new Animation(animation)
		return this.animation
	}

	public clearAnimation(frame = 0) {
		this.animation = undefined
		this.frame = frame
	}

	public setTexture(data: GameDataSprite, animation?: Animation | AnimationDefinition | null) {
		if (this.currentTexture == data && !animation) {
			return
		}
		this.currentTexture = data
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
	idle: GameDataSprite
	up: GameDataSprite
	down: GameDataSprite
	left: GameDataSprite
	right: GameDataSprite
}

export class MovableItemSprite extends ItemSprite {
	public readonly walkSequence: WalkSequence
	public speed: number
	protected moving: boolean
	protected path: Path[]
	protected movementSmoother: MovementSmoother
	protected vector: [number, number]

	public static createWalkSequence(name: string): WalkSequence  {
		return {
			idle: Sprite.find(name + "-idle"),
			up: Sprite.find(name + "-up"),
			down: Sprite.find(name + "-down"),
			left: Sprite.find(name + "-left"),
			right: Sprite.find(name + "-right")
		}
	}

	public constructor(walkSequence: WalkSequence, speed = CONST.WALK_BASE_SPEED) {
		super(walkSequence.idle)
		this.walkSequence = walkSequence
		this.speed = speed
		this.moving = false
		this.movementSmoother = new MovementSmoother()
		this.path = []
		this.vector = [0, 0]
	}

	public setVector(x: number, y: number) {
		this.vector[0] = x
		this.vector[1] = y
	}

	protected onCellChange() {
	}

	private updateWalkSequence(dX: number, dY: number) {
		let sprite
		if (dY < 0) {
			sprite = this.walkSequence.up
		} else if (dY > 0) {
			sprite = this.walkSequence.down
		} else if (dX < 0) {
			sprite = this.walkSequence.left
		} else if (dX > 0) {
			sprite = this.walkSequence.right
		} else {
			sprite = this.walkSequence.idle
		}
		this.setTexture(sprite)
	}

	public get pathActive() {
		return this.path.length > 0
	}

	public moveTo(x: number, y: number, smooth = true) {
		this.movementSmoother.moveTo(x, y)
		if (!smooth) {
			this.movementSmoother.reset()
		}
	}

	public moveBy(dx: number, dy: number, smooth = true) {
		this.movementSmoother.moveBy(dx, dy)
		if (!smooth) {
			this.movementSmoother.reset()
		}
	}

	public setMapPosition(x: number, y: number, force = true) {
		const cell = gameContext.map.getClampedCell(
			Math.floor(x / CONST.GRID_BASE),
			Math.floor(y / CONST.GRID_BASE)
		)
		if (cell != this._cell) {
			cell.addItem(this)
			this.onCellChange()
		}
		this.offset[0] = modulo(x, CONST.GRID_BASE)
		this.offset[1] = modulo(y, CONST.GRID_BASE)
		if (force) {
			this.clearPath()
			this.movementSmoother.moveTo(x, y)
			this.movementSmoother.reset()
		}
	}

	public update(delta: number) {
		super.update(delta)
		if (this.pathActive) {
			this.moving = true
			Path.updateArray(delta, this.path, (x, y, direction) => {
				this.moveTo(x, y)
				if (direction) {
					this.setTexture(this.walkSequence[direction])
				}
			})
		} else if (this.vector[0] != 0 || this.vector[1] != 0) {
			const offsetX = modulo(this.movementSmoother.tX, CONST.GRID_BASE)
			const offsetY = modulo(this.movementSmoother.tY, CONST.GRID_BASE)
			const cell = gameContext.map.getClampedCell(
				Math.floor(this.movementSmoother.tX / CONST.GRID_BASE),
				Math.floor(this.movementSmoother.tY / CONST.GRID_BASE)
			)
			this.moving = true
			const scalar = delta * (this.speed / CONST.WALK_SPEED_SCALE)
			for (let queryDelta = Math.ceil(scalar); queryDelta > 0; queryDelta -= 1) {
				const queryResponse = PathFinder.query(
					cell,
					Math.floor(offsetX),
					Math.floor(offsetY),
					this.vector[0] * queryDelta,
					this.vector[1] * queryDelta
				)
				if (queryResponse) {
					const norm = Math.sqrt(queryResponse[0] * queryResponse[0] + queryResponse[1] * queryResponse[1])
					if (norm > scalar + 0.001) {
						const scaledX = queryResponse[0] * scalar / norm
						const scaledY = queryResponse[1] * scalar / norm
						if (cell.isPointTraversable(Math.floor(offsetX + scaledX), Math.floor(offsetY + scaledY))) {
							this.moveBy(scaledX, scaledY)
							break
						}
					} else {
						this.moveBy(queryResponse[0], queryResponse[1])
						break
					}
				}
			}
			this.updateWalkSequence(this.vector[0], this.vector[1])
		} else if (this.moving) {
			if (this.movementSmoother.isMoving) {
				// just keep last state
			} else {
				this.setTexture(this.walkSequence.idle)
				this.moving = false
			}
		}
		this.movementSmoother.update(this.moving ? 0.4 : 0.65)
		this.setMapPosition(this.movementSmoother.x, this.movementSmoother.y, false)
	}

	public pushPath(path: readonly (readonly [number, number])[], speed?: number) {
		const object = new SimplePath(path.map(point => [point[0] + this.movementSmoother.x, point[1] + this.movementSmoother.y]), speed || this.speed)
		this.path.push(object)
		return object
	}

	public clearPath() {
		this.path = []
		this.setTexture(this.walkSequence.idle)
	}

	public disable() {
		this.clearAnimation()
		this.cell.removeItem(this)
	}
}

export default Sprite
