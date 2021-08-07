import { CONST } from "./Constants"

export interface PathFinderSearchable {
	isPointTraversable(x: number, y: number): boolean
}

export class PathFinder {
	private static rotate(data: Int32Array) {
		data = new Int32Array(data)
		for (let i = 0; i < data.length; i += 2) {
			const tmp = data[i]
			data[i] = data[i + 1]
			data[i + 1] = tmp
		}
		return data
	}

	private static flip(data: Int32Array) {
		data = new Int32Array(data)
		for (let i = 0; i < data.length; i += 1) {
			data[i] = -data[i]
		}
		return data
	}

	private static searchDiamond(delta: number) {
		const points = []
		for (let y = 0; y < (CONST.SEARCH_DIAMOND_MAX_SIZE + 1); y++) {
			for (let x = 0; x < (CONST.SEARCH_DIAMOND_MAX_SIZE + 1); x++) {
				if (x * x + y * y < (delta * delta + 0.0001)) {
					const fhi = x / Math.sqrt(x * x + y * y)
					if (fhi >= Math.cos(90.01 * Math.PI / 180) && fhi <= Math.cos(44.95 * Math.PI / 180)) {
						points.push([x, y])
					}
				}
			}
		}
		points.sort((a, b) => {
			const distA = a[0] * a[0] + a[1] * a[1]
			const distB = b[0] * b[0] + b[1] * b[1]
			return distA == distB ? b[1] - a[1] : distB - distA
		})
		if (delta == 1) {
			points.push([1,1])
		}
		const data = []
		for (const point of points) {
			data.push(point[0], point[1])
			if (point[0] != 0) {
				data.push(-point[0], point[1])
			}
		}
		return new Int32Array(data)
	}

	private static buildSearchDiamonds(delta: number) {
		const diamond = PathFinder.searchDiamond(delta)
		return {
			top: PathFinder.flip(diamond),
			left: PathFinder.flip(PathFinder.rotate(diamond)),
			bottom: diamond,
			right: PathFinder.rotate(diamond)
		}
	}

	private static diamonds = (() => {
		const diamonds = []
		for (let i = 1; i <= CONST.SEARCH_DIAMOND_MAX_SIZE; i += 1) {
			diamonds.push(PathFinder.buildSearchDiamonds(i))
		}
		return diamonds
	})()

	public static query(object: PathFinderSearchable, x: number, y: number, dx: number, dy: number) {
		let diamond
		let delta
		if (dx != 0) {
			delta = Math.min(Math.abs(Math.floor(dx)), CONST.SEARCH_DIAMOND_MAX_SIZE - 1)
			diamond = dx > 0 ? PathFinder.diamonds[delta].right : PathFinder.diamonds[delta].left
		} else if (dy != 0) {
			delta = Math.min(Math.abs(Math.floor(dy)), CONST.SEARCH_DIAMOND_MAX_SIZE - 1)
			diamond = dy > 0 ? PathFinder.diamonds[delta].bottom : PathFinder.diamonds[delta].top
		} else {
			return null
		}
		for (let i = 0; i < diamond.length; i += 2) {
			const isTraversable = object.isPointTraversable(x + diamond[i], y + diamond[i + 1])
			if (diamond[i] == 0 || diamond[i + 1] == 0) {
				if (isTraversable) {
					return [diamond[i], diamond[i + 1]]
				}
			} else {
				if (object.isPointTraversable(x + diamond[i + 2], y + diamond[i + 3])) {
					if (!isTraversable) {
						return [diamond[i + 2], diamond[i + 3]]
					}
				} else {
					if (isTraversable) {
						return [diamond[i], diamond[i + 1]]
					}
				}
				i += 2
			}
		}
		return null
	}
}

export default PathFinder
