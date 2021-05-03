export class MovementSmoother {
	private targetX: number
	private targetY: number

	private currentX: number
	private currentY: number

	public constructor() {
		this.targetX = 0
		this.targetY = 0
		this.currentX = 0
		this.currentY = 0
	}

	public reset() {
		this.currentX = this.targetX
		this.currentY = this.targetY
	}

	public moveBy(dX: number, dY: number) {
		this.targetX += dX
		this.targetY += dY
	}

	public moveTo(x: number, y: number) {
		this.targetX = x
		this.targetY = y
	}

	public get isMoving() {
		return Math.abs(this.targetX - this.currentX) + Math.abs(this.targetY - this.currentY) > 0.5
	}

	public update(smoothingFactor: number) {
		this.currentX = this.currentX + smoothingFactor * (this.targetX - this.currentX)
		this.currentY = this.currentY + smoothingFactor * (this.targetY - this.currentY)
	}

	public get dX() {
		return this.targetX - this.currentX
	}

	public get dY() {
		return this.targetY - this.currentY
	}

	public get tX() {
		return this.targetX
	}

	public get tY() {
		return this.targetY
	}

	public get x() {
		return this.currentX
	}

	public get y() {
		return this.currentY
	}
}
