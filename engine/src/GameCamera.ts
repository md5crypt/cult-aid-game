import { SimplePath, Path } from "./Path"
import { Sprite } from "./Sprite"
import { CONST } from "./Constants"

export class GameCamera {
	private pivotPaths: Path[]
	private zoomPaths: Path[]

	private _pivot: [number, number]
	private _zoom: [number, number]

	private lock: Sprite.Item | null

	constructor() {
		this.pivotPaths = []
		this.zoomPaths = []
		this._pivot = [0, 0]
		this._zoom = [1, 0]
		this.lock = null
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
		return this.moveBy(x - this._pivot[0], y - this._pivot[1], duration)
	}

	public zoomBy(dz: number, duration: number) {
		const speed = Math.abs(dz / duration) * CONST.WALK_SPEED_SCALE
		const path = new SimplePath([this._zoom.slice(0), [this._zoom[0] + dz, 0]], speed)
		this.pushZoomPath(path)
		return new Promise(resolve => path.onEnd.add(resolve as (arg?: any) => void))
	}

	public zoomTo(zoom: number, duration: number) {
		return this.zoomBy(zoom - this._zoom[0], duration)
	}

	public get zoom() {
		return this._zoom[0]
	}

	public set zoom(value: number) {
		if (this.zoomPaths.length == 0) {
			this._zoom[0] = value
		}
	}

	public get pivot() {
		return [this._pivot[0], this._pivot[1]]
	}

	public set pivot(value: [number, number]) {
		if (this.pivotPaths.length != 0) {
			this.lock = null
			this._pivot[0] = value[0]
			this._pivot[1] = value[1]
		}
	}

	public lockOn(target: Sprite.Item) {
		if (this.pivotPaths.length != 0) {
			throw new Error("can not lock on target, path in progress")
		}
		this.lock = target
	}

	public update(delta: number) {
		if (this.lock) {
			this._pivot = this.lock.getAbsoluteLocation()
			if (this.zoomPaths.length > 0) {
				Path.updateArray(delta, this.zoomPaths, this._zoom)
			}
		} else {
			if (this.pivotPaths.length > 0) {
				Path.updateArray(delta, this.pivotPaths, this._pivot)
			}
		}
	}
}
