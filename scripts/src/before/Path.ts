class Path {
	static get(path: keyof typeof PathId) {
		return context.map.getObject("path", path)
	}

	static getPoint(path: Types.GameData.PathData | keyof typeof PathId, index: number) {
		const data = typeof path == "string" ? this.get(path) : path
		return [
			data.points[index][0] + data.position[0],
			data.points[index][1] + data.position[1]
		] as const
	}
}
