export class Point {
	static get(point: keyof typeof PointId) {
		return context.map.getObject("point", point)
	}

	static resolve(point: keyof typeof PointId | readonly [number, number]) {
		const position = typeof point == "string" ? this.get(point).position : point
		return context.map.resolvePosition(position[0], position[1])
	}
}

export default Point
