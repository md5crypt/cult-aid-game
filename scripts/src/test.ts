
scripts.register("test", "cellUse", (_cell) => {
	void context.camera.shake(1000)
})

scripts.register("placePlayer", "cellCreate", async (cell) => {
	context.player.enable(cell.x, cell.y)
	context.camera.lockOn(context.player)
})

scripts.register("trap", "cellEnter", async (cell) => {
	const {camera, player, map} = context
	player.inputEnabled = false
	void camera.moveTo(
		(cell.x * CONST.GRID_BASE) + (CONST.GRID_BASE >> 1),
		(cell.y * CONST.GRID_BASE) + (CONST.GRID_BASE >> 1),
		500
	)
	void camera.zoomTo(camera.screenSize[1] / CONST.GRID_BASE, 500)
	await player.waitWalkEnd()
	player.setTexture(context.Sprite.find("khajiit-idle"), null)
	const animation = new context.Animation([
		["sequence", 0, 5],
		["invoke", "spider"],
		["sequence", 6, 11]
	], 200)
	animation.onInvoke.add(() => {
		const spider = context.Item.create("spider-attack")
		const animation = new context.Animation([
			["sequence", 0, 1],
			["invoke", "shake"],
			["sequence", 2, 6],
			["frame", 7, 0]
		], 200)
		animation.onEnd.add(async () => {
			player.cell.addItem(context.Item.create("spider-web"))
			await context.timer.wait(200)
			camera.enabled = false
			player.cell.clearItems()
			map.getCellByName("init-room").addItem(player)
			player.setTexture(player.walkSequence.idle)
			camera.zoom = 1
			camera.lockOn(player)
			map.cells.forEach(cell => cell.visible = false)
			map.getCellByName("init-room").visible = true
			await context.timer.wait(500)
			player.inputEnabled = true
			camera.enabled = true
		})
		animation.onInvoke.add(() => (camera.shake(400, 1), false))
		spider.setAnimation(animation)
		player.cell.addItem(spider)
		return true
	})
	player.setTexture(context.Sprite.find("khajiit-spider"), animation)
})
