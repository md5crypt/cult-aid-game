scripts.register("fragmentInvoke", FragmentId["librarian-enter-library"], async () => {
	context.ui.dialog.hide()
	await Utils.executePath(PathId["library-retreat"])
	context.ui.dialog.show()
})

scripts.register("dialogStart", DialogId["librarian-body"], () => Fragment.executeIfUnseen("librarian-body-intro"))

scripts.register("fragmentInvoke", FragmentId["librarian-body.option.take-map"], Inventory.equipHandler("map"))

scripts.register("fragmentInvoke", FragmentId["librarian-sweetroll.option.do-nothing"], Inventory.unEquipHandler("sweetroll", value => {
	// todo: animation
	storage.librarian.knockedOut = true
}))

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.chef"], async (state) => {
	if (state == "wait") {
		await Utils.blackScreen(500) // todo
	} else {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.librarian"], async (state) => {
	storage.librarian.vampPaperSeen = true
	if (state == "wait") {
		await Utils.blackScreen(500) // todo
	} else {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.mage"], async (state) => {
	if (state == "wait") {
		await Utils.blackScreen(500) // todo
	} else {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.maid"], async (state) => {
	switch (state) {
		case "wait":
			return Utils.blackScreen(500) // todo
		case "show":
			context.ui.dialog.hide()
			await context.ui.newspaper.open(true)
			context.ui.dialog.show()
			break
		case "hide":
			context.ui.newspaper.enabled = false
			break
	}
})

scripts.register("fragmentAfter", FragmentId["librarian-newspaper-read-end"], async () => {
	await Utils.executePath(PathId["library-newspapers"])
	storage.library.newspapers = true
	context.map.getObject<"item">(ItemId["library-newspapers"]).enabled = true
})

scripts.register("dialogStart", DialogId["librarian-newspaper-select"], () => {
	Fragment.setVisibility("librarian-newspaper-select.option.chef", Fragment.seen("librarian-fetch.option.chef"))
	Fragment.setVisibility("librarian-newspaper-select.option.librarian", Fragment.seen("librarian-fetch.option.librarian"))
	Fragment.setVisibility("librarian-newspaper-select.option.mage", Fragment.seen("librarian-fetch.option.mage"))
	Fragment.setVisibility("librarian-newspaper-select.option.maid", Fragment.seen("librarian-fetch.option.maid"))
})

scripts.register("dialogSelect", DialogId["librarian-newspaper-select"], async option => {
	if (option != "exit") {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("dialogStart", DialogId["librarian-main"], async () => {
	Fragment.setVisibilityIfUnseen("librarian-main.option.sweetroll", Inventory.has("sweetroll"))
	Fragment.setVisibility("librarian-main.option.scribbles", Inventory.has("scribbles"))
	Fragment.showIf("librarian-main.option.vampire", Fragment.seen("librarian-main.option.cultists", "librarian-main.option.live-here"))
	Fragment.showUnseenIf("librarian-main.option.archaeologist", storage.archeologist.visited)
	Fragment.showUnseenIf("librarian-main.option.inscription", Fragment.seen("librarian-main.option.dwemer") && storage.maid.needsInscription)
	Fragment.setVisibility("librarian-main.option.newspapers", Fragment.seen("librarian-main.option.scribbles"))
	Fragment.setSeenIf("librarian-main.option.newspapers", Dialog.seen("librarian-fetch", ["librarian-fetch.option.back"]))
	await Fragment.executeIfUnseen("librarian-intro")
})

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.scribbles"], Inventory.unEquipHandler("scribbles"))

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.copy"], Inventory.equipHandler("newspaper"))

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.copy"], async () => {
	await Utils.blackScreen(500) // todo
})

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.key"], Inventory.equipHandler("key"))

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.take-inscription"], Inventory.equipHandler("inscription"))


scripts.register("fragmentInvoke", FragmentId["forbidden-section-enter-attempt"], async token => {
	switch (token) {
		case "walk-in":
			context.ui.dialog.hide()
			await Utils.executePath(PathId["library-darkness-entry"])
			await context.timer.wait(1000)
			context.ui.dialog.show()
			break
		case "inside":
			context.ui.dialog.hide()
			await context.timer.wait(1000)
			context.ui.dialog.show()
			break
		case "walk-out":
			context.ui.dialog.hide()
			await Utils.executePath(PathId["library-darkness-retreat"])
			context.ui.dialog.show()
			break
	}
})

scripts.register("fragmentInvoke", FragmentId["forbidden-section-enter"], async () => {
	context.ui.dialog.hide()
	await Utils.executePath(PathId["library-darkness-entry"])
	await context.map.loadMap(MapId["forbidden-section"])
	context.ui.dialog.show()
})

scripts.register("zoneEnter", ZoneId["library-darkness"], async () => {
	if (Inventory.has("map")) {
		if (!storage.dialog.seen["forbidden-section-enter"]) {
			await Fragment.execute("forbidden-section-enter")
		} else {
			context.player.lockInput()
			await Utils.executePath(PathId["library-darkness-entry"])
			await context.map.loadMap("map-forbidden-section")
			context.player.unlockInput()
		}
	} else {
		if (!storage.dialog.seen["forbidden-section-enter-attempt"]) {
			await Fragment.execute("forbidden-section-enter-attempt")
		} else {
			await Fragment.execute("forbidden-section-enter-deny")
		}
	}
})

scripts.register("zoneUse", ZoneId["library-librarian"], async () => {
	context.player.lockInput()
	await Utils.walkToPositions(Utils.pathPoint(PathId["library-newspapers"], 0))
	context.player.unlockInput()
	if (storage.librarian.knockedOut) {
		await Dialog.execute("librarian-body")
	} else {
		await Dialog.execute("librarian-main")
	}
})

scripts.register("zoneEnter", ZoneId["library-entrance"], async () => {
	if (Fragment.unseen("librarian-enter-library")) {
		context.player.cell.group.forEach(x => x.visible = true)
		await Utils.executePath(PathId["library-enter"])
		await Fragment.execute("librarian-enter-library")
	}
})

scripts.register("zoneUse", ZoneId["library-newspapers"], async () => {
	if (storage.library.newspapers) {
		await Dialog.execute("librarian-newspaper-select")
	}
})

RegionLoader.register(MapId["main"], () => {
	context.map.getObject<"item">(ItemId["library-newspapers"]).enabled = storage.library.newspapers
})
