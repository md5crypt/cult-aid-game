import Path from "./Path"
import Point from "./Point"

export class Player {
	static lockInput() {
		context.player.lockInput()
	}

	static unlockInput() {
		context.player.unlockInput()
	}

	static walkToPoint(point: keyof typeof PointId | readonly [number, number]) {
		const position = typeof point == "string" ? Point.get(point).position : point
		const origin = context.player.getAbsoluteLocation()
		if ((position[0] == origin[0]) && (position[1] == origin[1])) {
			return Promise.resolve()
		}
		context.player.lockInput()
		return context.player.pushPath([
			[0, 0],
			[position[0] - origin[0], position[1] - origin[1]]
		]).onEnd.promise().then(() => context.player.unlockInput())
	}

	static moveToPoint(point: keyof typeof PointId | readonly [number, number]) {
		const position = typeof point == "string" ? Point.get(point).position : point
		context.player.setMapPosition(position[0], position[1])
	}

	static async executePath(path: Types.GameDataPath | keyof typeof PathId | Path, moveToPosition?: "move" | "walk") {
		const data = typeof path == "string" ? Path.get(path) : path
		Player.lockInput()
		if (moveToPosition == "move") {
			Player.moveToPoint(data.position)
		} else if (moveToPosition == "walk") {
			await Player.walkToPoint(data.position)
		}
		return context.player.pushPath(data.points).onEnd.promise().then(() => Player.unlockInput())
	}
}

export default Player
