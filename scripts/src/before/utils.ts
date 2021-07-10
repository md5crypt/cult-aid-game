class Utils {
	static async reset() {
		const {camera, map} = context
		camera.enabled = false
		context.player.cell.clearItems()
		const point = Point.get("init-room").position
		Player.moveToPoint(point)
		camera.zoom = camera.zoomDefault
		camera.lockOn(context.player)
		map.cells.forEach(cell => cell.visible = false)
		Point.resolve(point).cell.visible = true
		await context.timer.wait(500)
		Player.unlockInput()
		camera.enabled = true
	}

	static async blackScreen(delay: number) {
		context.camera.enabled = false
		context.ui.enabled = false
		await context.timer.wait(delay)
		context.camera.enabled = true
		context.ui.enabled = true
	}

	static wait(delay: number) {
		return context.timer.wait(delay)
	}
}
