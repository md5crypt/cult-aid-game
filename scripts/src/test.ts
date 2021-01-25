namespace utils {
	export async function reset() {
		const {camera, player, map} = context
		camera.enabled = false
		player.cell.clearItems()
		const position = map.getPositionByName("init-room")
		player.enable(position.cell, position.offset)
		player.setTexture(player.walkSequence.idle)
		camera.zoom = camera.zoomDefault
		camera.lockOn(player)
		map.cells.forEach(cell => cell.visible = false)
		position.cell.visible = true
		await context.timer.wait(500)
		player.unlockInput()
		camera.enabled = true
	}
}

scripts.register("dialogSelect", DialogId["test-give-item"], id => {
	if (id == "book" || id == "sweetroll") {
		storage.items[id] = true
	}
})

scripts.register("dialogSelect", DialogId["card-game-test"], id => {
	if (id != "exit") {
		context.camera.enabled = false
		context.ui.cardGame.enabled = true
		context.ui.cardGame.interactive = false
		void context.ui.dialog.ensureClosed().then(() => context.ui.cardGame.interactive = true)
		void context.ui.cardGame.startGame(parseInt(id))
			.then(result => context.speech.executeFragment(result ? FragmentId["card-game-success"] : FragmentId["card-game-fail"], true))
			.then(() => {
				context.camera.enabled = true
				context.ui.cardGame.enabled = false
				void context.speech.executeDialog(DialogId["card-game-test"], true)
				context.speech.dialog.unshift(DialogId["test-main"])
			})
	}
})


scripts.register("dialogStart", DialogId["technician-main"], async () => {
	storage.dialog.hidden["technician-main.option.book"] = !(storage.items.book && storage.dialog.seen["technician-main.option.reading"])
	storage.dialog.hidden["technician-main.option.sweetroll"] = !storage.items.sweetroll
	if (!storage.technician.introSeen) {
		storage.technician.introSeen = true
		await context.speech.executeFragment(FragmentId["technician-intro"])
	}
})

scripts.register("cellUse", "test", (_cell) => {
	void context.speech.executeDialog(DialogId["test-main"])
})

scripts.register("cellCreate", "placePlayer", async (cell) => {
	const position = context.map.getPositionByName("init-room")
	context.player.enable(position.cell, position.offset)
	context.camera.lockOn(context.player)
	//void context.speech.executeDialog(DialogId["test-main"])
})

scripts.register("cellEnter", "fireTrap", async (cell) => {
	const {camera, player} = context
	player.lockInput()
	void camera.moveToCell(cell.x, cell.y, 500)
	void camera.zoomTo(camera.zoomCell, 500)
	await context.timer.wait(400)
	const fire = context.Item.create("fire-trap-fire")
	fire.setAnimation([
		["frame", 0, 200],
		["invoke", "glyph"],
		["delay", 700],
		["sequence", 1, 2, 100],
		[
			["sequence", 3, 4, 100],
			["loop"]
		]
	]).onInvoke.add(() => player.setTexture(context.Sprite.find("fire-trap-khajiit"), [
		["frame", 0, 400],
		["sequence", 1, 3, 200],
		["frame", 4, 400],
		["sequence", 4, 7, 200],
		["frame", 8, 600],
		[
			["sequence", 9, 10, 200],
			["loop", 4]
		],
		["invoke", () => (utils.reset(), true)]
	]))
	player.cell.addItem(fire)
})

scripts.register("cellEnter", "spiderTrap", async (cell) => {
	const {camera, player, map} = context
	player.lockInput()
	void camera.moveToCell(cell.x, cell.y, 500)
	void camera.zoomTo(camera.zoomCell, 500)
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
		animation.onEnd.add(() => {
			player.cell.addItem(context.Item.create("spider-web"))
			void context.timer.wait(200).then(utils.reset)
		})
		animation.onInvoke.add(() => (camera.shake(400, 1), false))
		spider.setAnimation(animation)
		player.cell.addItem(spider)
		return true
	})
	player.setTexture(context.Sprite.find("khajiit-spider"), animation)
})

scripts.register("cellEnter", "autoReveal", (cell) => {
	cell.group.forEach(x => x.visible = true)
})

scripts.register("zoneUse", "technician", zone => {
	void context.speech.executeDialog(DialogId["technician-main"])
})

scripts.register("zoneUse", "power-supply", zone => {
	void context.speech.executeFragment(FragmentId["technician-touch-server"])
})

scripts.register("cellEnter", "roomEnter", (cell, direction) => {
	/*const reverse = {
		up: "down",
		down: "up",
		left: "right",
		right: "left"
	} as const
	if (reverse[direction] == cell.data?.gateway) {
		const group = cell.getGroup()
		const bounds = cell.getGroupBounds(group)
		group.forEach(x => x.setVisible())
		context.player.lockInput()
		void Promise.all([
			context.camera.moveTo(
				(bounds[0] + (bounds[2] / 2)) * CONST.GRID_BASE,
				((bounds[1] + (bounds[3] / 2)) * CONST.GRID_BASE) + 6,
				500
			),
			context.camera.zoomTo(
				context.camera.zoomCell / Math.max(bounds[2], bounds[3]),
				500
			)
		]).then(() => context.player.unlockInput())
	}*/
})

scripts.register("cellExit", "roomExit", (cell, direction) => {
	/*if (direction == cell.data?.gateway) {
		const next = cell.getNeighbor(direction)
		const path = next.getEnterPath(direction)!
		const center = path[path.length - 1]
		context.player.lockInput()
		void Promise.all([
			context.camera.zoomTo(context.camera.zoomDefault, 500),
			context.camera.moveTo(
				(next.x * CONST.GRID_BASE) + center[0],
				(next.y * CONST.GRID_BASE) + center[1],
				500
			)
		]).then(() => {
			context.camera.lockOn(context.player)
			context.player.unlockInput()
		})
	}*/
})
