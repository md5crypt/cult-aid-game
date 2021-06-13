class Utils {
	static async reset() {
		const {camera, player, map} = context
		camera.enabled = false
		player.cell.clearItems()
		const point = this.getPoint(PointId["init-room"])
		player.setMapPosition(...point)
		player.setTexture(player.walkSequence.idle)
		camera.zoom = camera.zoomDefault
		camera.lockOn(player)
		map.cells.forEach(cell => cell.visible = false)
		Utils.resolvePosition(point).cell.visible = true
		await context.timer.wait(500)
		player.unlockInput()
		camera.enabled = true
	}

	static async blackScreen(delay: number) {
		context.camera.enabled = false
		context.ui.enabled = false
		await context.timer.wait(delay)
		context.camera.enabled = true
		context.ui.enabled = true
	}

	static getPoint(point: PointId) {
		return context.map.getObject<"point">(point).position
	}

	static resolvePosition(point: PointId | readonly [number, number]) {
		const position = Array.isArray(point) ? point : this.getPoint(point as PointId)
		return context.map.resolvePosition(position[0], position[1])
	}

	static pathPoint(path: Types.GameData.PathData | PathId, index: number) {
		const data = typeof path == "string" ? context.map.getObject<"path">(path) : path
		return [
			data.points[index][0] + data.position[0],
			data.points[index][1] + data.position[1]
		] as const
	}

	static twoPointPath(from: readonly number[], to: readonly number[]) {
		return [[0, 0], [to[0] - from[0], to[1] - from[1]]] as const
	}

	static walkToPositions(position: readonly [number, number]) {
		return context.player.pushPath(Utils.twoPointPath(
			context.player.getAbsoluteLocation(),
			position
		)).onEnd.promise()
	}

	static walkToPoint(point: PointId) {
		context.player.lockInput()
		return this.walkToPositions(this.getPoint(point)).then(() => context.player.unlockInput())
	}

	static executePath(path: Types.GameData.PathData | PathId) {
		const data = typeof path == "string" ? context.map.getObject<"path">(path) : path
		context.player.lockInput()
		return context.player.pushPath(data.points).onEnd.promise().then(() => context.player.unlockInput())
	}
}
