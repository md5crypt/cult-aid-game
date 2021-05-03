scripts.register("fragmentInvoke", FragmentId["librarian-enter-library"], async () => {
	context.ui.dialog.hide()
	await context.player.pushPath(context.map.getObject<"path">(PathId["library-retreat"]).points).onEnd.promise()
	context.ui.dialog.show()
})

scripts.register("dialogStart", DialogId["librarian-body"], () => utils.executeIfUnseen("librarian-body-intro"))

scripts.register("fragmentAfter", FragmentId["librarian-body.option.take-map"], () => {
	storage.items.map = true
})

scripts.register("fragmentInvoke", FragmentId["librarian-sweetroll.option.do-nothing"], () => {
	storage.items.sweetroll = false
	storage.librarian.knockedOut = true
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.chef"], async (state) => {
	if (state == "wait") {
		await utils.blackScreen(500) // todo
	} else {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.librarian"], async (state) => {
	storage.librarian.vampPaperSeen = true
	if (state == "wait") {
		await utils.blackScreen(500) // todo
	} else {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.mage"], async (state) => {
	if (state == "wait") {
		await utils.blackScreen(500) // todo
	} else {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.maid"], async (state) => {
	switch (state) {
		case "wait":
			return utils.blackScreen(500) // todo
		case "show":
			context.ui.dialog.hide()
			await context.ui.newspaper.open(true)
			context.ui.dialog.show()
			break
		case "hide":
			context.ui.newspaper.root.enabled = false
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
	storage.dialog.hidden["librarian-newspaper-select.option.chef"] = !storage.dialog.hidden["librarian-fetch.option.chef"]
	storage.dialog.hidden["librarian-newspaper-select.option.librarian"] = !storage.dialog.hidden["librarian-fetch.option.librarian"]
	storage.dialog.hidden["librarian-newspaper-select.option.mage"] = !storage.dialog.hidden["librarian-fetch.option.mage"]
	storage.dialog.hidden["librarian-newspaper-select.option.maid"] = !storage.dialog.hidden["librarian-fetch.option.maid"]
})

scripts.register("dialogSelect", DialogId["librarian-newspaper-select"], async option => {
	if (option != "exit") {
		context.ui.dialog.hide()
		await context.ui.newspaper.open()
		context.ui.dialog.show()
	}
})

scripts.register("dialogStart", DialogId["librarian-main"], async () => {
	storage.dialog.hidden["librarian-main.option.sweetroll"] = !storage.items.sweetroll || storage.dialog.seen["librarian-main.option.sweetroll"]
	storage.dialog.hidden["librarian-main.option.scribbles"] = !storage.items.scribbles
	storage.dialog.hidden["librarian-main.option.vampire"] = !storage.dialog.seen["librarian-main.option.cultists"] || !storage.dialog.seen["librarian-main.option.live-here"]
	storage.dialog.hidden["librarian-main.option.archaeologist"] = storage.dialog.seen["librarian-main.option.archaeologist"] || false // todo
	storage.dialog.hidden["librarian-main.option.inscription"] = !storage.dialog.seen["librarian-main.option.dwemer"] || storage.items.inscription || false //todo
	storage.dialog.hidden["librarian-main.option.newspapers"] = !storage.dialog.seen["librarian-main.option.scribbles"] && !(
		storage.dialog.hidden["librarian-fetch.option.chef"] &&
		storage.dialog.hidden["librarian-fetch.option.librarian"] &&
		storage.dialog.hidden["librarian-fetch.option.mage"] &&
		storage.dialog.hidden["librarian-fetch.option.maid"]
	)
	await utils.executeIfUnseen("librarian-intro")
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.scribbles"], () => {
	storage.items.scribbles = false
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.copy"], () => {
	storage.items.newspaper = true
})

scripts.register("fragmentInvoke", FragmentId["librarian-main.option.copy"], async () => {
	await utils.blackScreen(500) // todo
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.key"], () => {
	storage.items.key = true
})

scripts.register("fragmentAfter", FragmentId["librarian-main.option.take-inscription"], () => {
	storage.items.inscription = true
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
	if (storage.items.map) {
		if (!storage.dialog.seen["forbidden-section-enter"]) {
			await utils.executeFragment("forbidden-section-enter")
		} else {
			context.player.lockInput()
			await context.player.pushPath(context.map.getObject<"path">(PathId["library-darkness-entry"]).points).onEnd.promise()
			await context.map.loadMap("map-forbidden-section")
			context.player.unlockInput()
		}
	} else {
		if (!storage.dialog.seen["forbidden-section-enter-attempt"]) {
			await utils.executeFragment("forbidden-section-enter-attempt")
		} else {
			await utils.executeFragment("forbidden-section-enter-deny")
		}
	}
})

scripts.register("zoneUse", ZoneId["library-librarian"], async () => {
	context.player.lockInput()
	const path = context.map.getObject<"path">(PathId["library-newspapers"])
	await context.player.pushPath(utils.twoPointPath(context.player.getAbsoluteLocation(), utils.pathPoint(path, 0))).onEnd.promise()
	context.player.unlockInput()
	if (storage.librarian.knockedOut) {
		utils.executeDialog("librarian-body")
	} else {
		utils.executeDialog("librarian-main")
	}
})

scripts.register("zoneEnter", ZoneId["library-entrance"], async () => {
	if (!storage.dialog.seen["librarian-enter-library"]) {
		context.player.cell.group.forEach(x => x.visible = true)
		context.player.lockInput()
		await context.player.pushPath(context.map.getObject<"path">(PathId["library-enter"]).points).onEnd.promise()
		await utils.executeFragment("librarian-enter-library")
		context.player.unlockInput()
	}
})

scripts.register("zoneUse", ZoneId["library-newspapers"], async () => {
	if (storage.library.newspapers) {
		utils.executeDialog("librarian-newspaper-select")
	}
})

regionLoader.register(MapId["main"], () => {
	context.map.getObject<"item">(ItemId["library-newspapers"]).enabled = storage.library.newspapers
})
