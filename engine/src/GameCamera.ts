import { SimplePath, Path } from "./Path"
import { ItemSprite } from "./Sprite"
import { gameContext } from "./GameContext"
import { modulo } from "./utils"
import { CONST } from "./Constants"

interface Shaker {
	magnitude: number
	duration: number
	speed: number
	timer: number
	x: number
	y: number
	resolve: () => void
}

export class GameCamera {
	private pivotPaths: Path[]
	private zoomPaths: Path[]

	private _pivot: [number, number]
	private _zoom: number

	private _screen: readonly [number, number]

	private lock: ItemSprite | null

	private shaker?: Shaker

	private _zoomDefault: number

	constructor() {
		this.pivotPaths = []
		this.zoomPaths = []
		this._pivot = [0, 0]
		this._zoom = 1
		this.lock = null
		this._screen = [0, 0]
		this._zoomDefault = 1
	}

	public get zoomCell() {
		return this.screenSize[1] / CONST.GRID_BASE
	}

	public get zoomDefault() {
		return this._zoomDefault
	}

	public set zoomDefault(value: number) {
		const k = value / this._zoomDefault
		this._zoomDefault = value
		this.zoom *= k
	}

	public get screenSize() {
		return this._screen
	}

	/** @internal */
	public updateScreenSize(width: number, height: number) {
		this._screen = [width, height]
	}

	public set enabled(value: boolean) {
		gameContext.stage.tile.visible = value
	}

	public get enabled() {
		return gameContext.stage.tile.visible
	}

	public shake(
		duration: number,
		magnitude = CONST.CAMERA_SHAKE_DEFAULT_MAGNITUDE,
		speed = CONST.CAMERA_SHAKE_DEFAULT_SPEED
	): Promise<void> {
		if (this.shaker) {
			this.shaker.resolve()
		}
		return new Promise(resolve => this.shaker = {
			duration,
			magnitude,
			speed,
			resolve,
			timer: 0,
			x: 0,
			y: 0
		})
	}

	public pushPivotPath(path: Path) {
		this.lock = null
		this.pivotPaths.push(path)
	}

	public pushZoomPath(path: Path) {
		this.zoomPaths.push(path)
	}

	public moveBy(dx: number, dy: number, duration: number): Promise<void> {
		const speed = (Math.sqrt((dx * dx) + (dy * dy)) / duration) * CONST.WALK_SPEED_SCALE
		const path = new SimplePath([this._pivot.slice(0), [this._pivot[0] + dx, this._pivot[1] + dy]], speed)
		this.pushPivotPath(path)
		return new Promise(resolve => path.onEnd.add(resolve as (arg?: any) => void))
	}

	public moveTo(x: number, y: number, duration: number) {
		const width = gameContext.map.pixelWidth
		const height = gameContext.map.pixelHeight
		const dx = modulo(x - this._pivot[0], width)
		const dy = modulo(y - this._pivot[1], height)
		return this.moveBy(
			dx > (width / 2) ? dx - width : dx,
			dy > (height / 2) ? dy - height : dy,
			duration
		)
	}

	public moveToCell(x: number, y: number, duration: number) {
		return this.moveTo(
			(x * CONST.GRID_BASE) + (CONST.GRID_BASE >> 1),
			(y * CONST.GRID_BASE) + (CONST.GRID_BASE >> 1),
			duration
		)
	}

	public zoomBy(dz: number, duration: number) {
		const speed = Math.abs(dz / duration) * CONST.WALK_SPEED_SCALE
		const path = new SimplePath([[this._zoom, 0], [this._zoom + dz, 0]], speed)
		this.pushZoomPath(path)
		return new Promise(resolve => path.onEnd.add(resolve as (arg?: any) => void))
	}

	public zoomTo(zoom: number, duration: number) {
		return this.zoomBy(zoom - this._zoom, duration)
	}

	public get zoom() {
		return this._zoom
	}

	public set zoom(value: number) {
		if (this.zoomPaths.length == 0) {
			this._zoom = value
		}
	}

	public get pivot() {
		return [this._pivot[0], this._pivot[1]]
	}

	public set pivot(value: [number, number]) {
		if (this.pivotPaths.length == 0) {
			this.lock = null
			this._pivot[0] = value[0]
			this._pivot[1] = value[1]
		}
	}

	public get position() {
		if (!this.shaker) {
			return this.pivot
		}
		return [
			this._pivot[0] + this.shaker.x,
			this._pivot[1] + this.shaker.y
		]
	}

	public lockOn(target: ItemSprite) {
		if (this.pivotPaths.length != 0) {
			throw new Error("can not lock on target, path in progress")
		}
		this.lock = target
	}

	public unlock() {
		this.lock = null
	}

	public update(delta: number) {
		if (this.lock) {
			this._pivot = this.lock.getAbsoluteLocation()
		} else {
			if (this.pivotPaths.length > 0) {
				Path.updateArray(delta, this.pivotPaths, (x, y) => {
					this._pivot[0] = x,
					this._pivot[1] = y
				})
			}
		}
		if (this.zoomPaths.length > 0) {
			Path.updateArray(delta, this.zoomPaths, zoom => this.zoom = zoom)
		}
		const shaker = this.shaker
		if (shaker) {
			shaker.timer += delta
			shaker.duration -= delta
			if (shaker.duration <= 0) {
				this.shaker = undefined
				shaker.resolve()
			} else {
				const steps = Math.floor(shaker.timer / shaker.speed)
				if (steps > 0) {
					shaker.timer -= shaker.speed * steps
					shaker.x = (Math.random() - 0.5) * shaker.magnitude * 2
					shaker.y = (Math.random() - 0.5) * shaker.magnitude * 2
				}
			}
		}
	}
}

export default GameCamera
