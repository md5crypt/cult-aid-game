export class Path {
	public static get(path: keyof typeof PathId) {
		return new this(context.map.getObject("path", path))
	}

	public readonly position: readonly [number, number]
	public readonly points: readonly (readonly [number, number])[]

	private constructor(path: Types.GameDataPath) {
		this.position = path.position
		this.points = path.points
	}

	public get length() {
		return this.points.length
	}

	public getPoint(index: number) {
		return [
			this.points[index][0] + this.position[0],
			this.points[index][1] + this.position[1]
		] as const
	}

	public get firstPoint() {
		return this.getPoint(0)
	}

	public get lastPoint() {
		return this.getPoint(this.points.length - 1)
	}
}

export default Path
