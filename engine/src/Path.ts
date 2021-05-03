import { CONST } from "./Constants"
import { Listener } from "./Listener"

export type Direction = "up" | "down" | "left" | "right"

export namespace Path {
	export function updateArray(delta: number, paths: Path[], callback: (x: number, y: number, direction: Direction | "idle") => void) {
		let diff = delta
		let path = paths[0]
		while (true) {
			diff = path.update(diff)
			if (diff >= 0) {
				paths.shift()
				if (paths.length > 0) {
					path.onEnd.invoke(path)
					path = paths[0]
					continue
				}
				callback(path.x, path.y, "idle")
				path.onEnd.invoke(path)
				break
			}
			callback(path.x, path.y, path.direction)
			break
		}
	}
}

export interface Path {
	x: number
	y: number
	direction: Direction
	update(delta: number): number
	// onEnd.invoke is called the object owner as it has to be
	// called after the owner updates its position...
	// ugly, I know
	readonly onEnd: Listener<Path>
}

export class SimplePath implements Path {
	public x: number
	public y: number
	public direction!: Direction
	public readonly onEnd: Listener<Path>
	private points: readonly (readonly number[])[]
	private delta!: number
	private accumulator: number
	private current: number
	private speed: number

	constructor(points: readonly (readonly number[])[], speed: number) {
		this.points = points
		this.x = points[0][0]
		this.y = points[0][1]
		this.current = 0
		this.speed = (speed / CONST.WALK_SPEED_SCALE) || Infinity
		this.accumulator = 0
		this.prepareNext()
		this.onEnd = new Listener()
	}

	private prepareNext() {
		const p1 = this.points[this.current]
		const p2 = this.points[this.current + 1]
		const dx = p2[0] - p1[0]
		const dy = p2[1] - p1[1]
		if (dx > 0) {
			if (dy > 0) {
				this.direction = (CONST.WALK_DIRECTION_MODIFIER * dx) > dy ? "right" : "down"
			} else {
				this.direction = (CONST.WALK_DIRECTION_MODIFIER * dx) > -dy ? "right" : "up"
			}
		} else {
			if (dy > 0) {
				this.direction = -(CONST.WALK_DIRECTION_MODIFIER * dx) > dy ? "left" : "down"
			} else {
				this.direction = -(CONST.WALK_DIRECTION_MODIFIER * dx) > -dy ? "left" : "up"
			}
		}
		this.delta = Math.sqrt((dx * dx) + (dy * dy)) / this.speed
	}

	public update(delta: number) {
		let value = this.accumulator + delta
		while (this.delta < value) {
			value -= this.delta
			if (this.current == (this.points.length - 2)) {
				this.x = this.points[this.current + 1][0]
				this.y = this.points[this.current + 1][1]
				// the update invoker is responsible for calling
				// onEnd.invoke, ugly I know
				// this.onEnd.invoke(this)
				return value
			}
			this.current += 1
			this.prepareNext()
		}
		this.accumulator = value
		const p1 = this.points[this.current]
		const p2 = this.points[this.current + 1]
		const dx = p2[0] - p1[0]
		const dy = p2[1] - p1[1]
		this.x = p1[0] + (dx * (this.accumulator / this.delta))
		this.y = p1[1] + (dy * (this.accumulator / this.delta))
		return -1
	}
}
