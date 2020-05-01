export interface Path {
	x: number
	y: number
	direction: "up" | "down" | "left" | "right"
	update(delta: number): number
}

export class SimplePath implements Path {
	public x: number
	public y: number
	public direction!: "up" | "down" | "left" | "right"
	private points: number[][]
	private delta!: number
	private current: number
	private speed: number

	constructor(points: number[][], speed: number) {
		this.points = points
		this.x = points[0][0]
		this.y = points[0][1]
		this.current = 0
		this.speed = speed
		this.prepareNext()
	}

	private prepareNext() {
		const p1 = this.points[this.current]
		const p2 = this.points[this.current + 1]
		const dx = p2[0] - p1[0]
		const dy = p2[1] - p1[1]
		if (dx > 0) {
			if (dy > 0) {
				this.direction = dx > dy ? "right" : "down"
			} else {
				this.direction = dx > -dy ? "right" : "up"
			}
		} else {
			if (dy > 0) {
				this.direction = -dx > dy ? "left" : "down"
			} else {
				this.direction = -dx > -dy ? "left" : "up"
			}
		}
		this.delta = Math.sqrt((dx * dx) + (dy * dy)) / this.speed
		this.current += 1
	}

	public update(delta: number) {
		let value = delta
		while (this.delta < value) {
			value -= this.delta
			if (this.current == (this.points.length - 1)) {
				return value
			}
			this.prepareNext()
		}
		this.delta -= value
		const p1 = this.points[this.current]
		const p2 = this.points[this.current + 1]
		const dx = p2[0] - p1[0]
		const dy = p2[1] - p1[1]
		this.x = p1[0] + dx * (this.speed * value)
		this.y = p1[1] + dy * (this.speed * value)
		return -1
	}
}
