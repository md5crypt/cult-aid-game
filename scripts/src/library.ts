scripts.register("fragmentInvoke", FragmentId["librarian-enter-library"], async () => {
	context.ui.dialog.hide()
	await context.player.pushPath(context.map.getObject<"path">(PathId["library-retreat"]).points).onEnd.promise()
	context.ui.dialog.show()
})

scripts.register("dialogStart", DialogId["librarian-body"], () => Fragment.executeIfUnseen("librarian-body-intro"))

scripts.register("fragmentAfter", FragmentId["librarian-body.option.take-map"], () => {
	Inventory.add("map")
})

scripts.register("fragmentInvoke", FragmentId["librarian-sweetroll.option.do-nothing"], () => {
	Inventory.remove("sweetroll")
	storage.librarian.knockedOut = true
})

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
	context.player.lockInput()
	const path = context.map.getObject<"path">(PathId["library-newspapers"])
	await context.player.pushPath(path.points).onEnd.promise()
	context.player.unlockInput()
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
	Fragment.showIf("librarian-main.option.vampire", Fragment.seen("librarian-main.option.cultists") && Fragment.seen("librarian-main.option.live-here"))
	Fragment.showUnseenIf("librarian-main.option.archaeologist", storage.archeologist.visited)
	Fragment.showUnseenIf("librarian-main.option.inscription", Fragment.seen("librarian-main.option.dwemer") && storage.maid.needsInscription)
	Fragment.setVisibility("librarian-main.option.newspapers", Fragment.seen("librarian-main.option.scribbles") && (
		Fragment.unseen("librarian-fetch.option.chef") ||
		Fragment.unseen("librarian-fetch.option.librarian") ||
		Fragment.unseen("librarian-fetch.option.mage") ||
		Fragment.unseen("librarian-fetch.option.maid")
	))
	await Fragment.executeIfUnseen("librarian-intro")
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.scribbles"], () => {
	Inventory.remove("scribbles")
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.copy"], () => {
	Inventory.add("newspaper")
})

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.copy"], async () => {
	await Utils.blackScreen(500) // todo
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.key"], () => {
	Inventory.add("key")
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.take-inscription"], () => {
	Inventory.add("inscription")
})

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.take-inscription"], () => {
	// todo
})


scripts.register("fragmentInvoke", FragmentId["forbidden-section-enter-attempt"], async token => {
	switch (token) {
		case "walk-in":
			context.ui.dialog.hide()
			await context.player.pushPath(context.map.getObject<"path">(PathId["library-darkness-entry"]).points).onEnd.promise()
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
			await context.player.pushPath(context.map.getObject<"path">(PathId["library-darkness-retreat"]).points).onEnd.promise()
			context.ui.dialog.show()
			break
	}
})

scripts.register("fragmentInvoke", FragmentId["forbidden-section-enter"], async () => {
	context.ui.dialog.hide()
	await context.player.pushPath(context.map.getObject<"path">(PathId["library-darkness-entry"]).points).onEnd.promise()
	await context.map.loadMap(MapId["forbidden-section"])
	context.ui.dialog.show()
})

scripts.register("zoneEnter", ZoneId["library-darkness"], async () => {
	if (Inventory.has("map")) {
		if (!storage.dialog.seen["forbidden-section-enter"]) {
			await Fragment.execute("forbidden-section-enter")
		} else {
			context.player.lockInput()
			await context.player.pushPath(context.map.getObject<"path">(PathId["library-darkness-entry"]).points).onEnd.promise()
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
	const path = context.map.getObject<"path">(PathId["library-newspapers"])
	await context.player.pushPath(Utils.twoPointPath(context.player.getAbsoluteLocation(), Utils.pathPoint(path, 0))).onEnd.promise()
	context.player.unlockInput()
	if (storage.librarian.knockedOut) {
		await Utils.executeDialog("librarian-body")
	} else {
		await Utils.executeDialog("librarian-main")
	}
})

scripts.register("zoneEnter", ZoneId["library-entrance"], async () => {
	if (!storage.dialog.seen["librarian-enter-library"]) {
		context.player.cell.group.forEach(x => x.visible = true)
		context.player.lockInput()
		await context.player.pushPath(context.map.getObject<"path">(PathId["library-enter"]).points).onEnd.promise()
		await Fragment.execute("librarian-enter-library")
		context.player.unlockInput()
	}
})

scripts.register("zoneUse", ZoneId["library-newspapers"], async () => {
	if (storage.library.newspapers) {
		await Utils.executeDialog("librarian-newspaper-select")
	}
})

RegionLoader.register(MapId["main"], () => {
	context.map.getObject<"item">(ItemId["library-newspapers"]).enabled = storage.library.newspapers
})
