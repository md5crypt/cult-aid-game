scripts.register("zoneEnter", ZoneId["office-entrance"], async () => {
	context.player.cell.group.forEach(x => x.visible = true)
	if (Fragment.unseen("bosmer-intro")) {
		await Utils.executePath(PathId["office-entrance"])
		await Fragment.execute("bosmer-intro")
	}
})

scripts.register("zoneUse", ZoneId["office-bosmer"], () => Dialog.execute("bosmer-main"))

scripts.register("zoneUse", ZoneId["office-board"], () => {
	if (Fragment.seen("bosmer-info-intro")) {
		return Dialog.execute("bosmer-board-main")
	} else {
		return Fragment.execute("bosmer-board-deny")
	}
})

scripts.register("dialogStart", DialogId["bosmer-main"], () => {
	Fragment.setVisibility("bosmer-main.option.mirror", Inventory.has("mirror") && Fragment.seen("bosmer-main.option.head-1") && Fragment.unseen("bosmer-main.option.hair"))
	Fragment.setVisibility("bosmer-main.option.mirror-2", Inventory.has("mirror") && Fragment.seen("bosmer-main.option.head-1", "bosmer-main.option.hair"))
	Fragment.showUnseenIf("bosmer-main.option.hair", storage.bosmer.seenMirror && Fragment.seen("bosmer-main.option.head-1", "bosmer-info.option.librarian"))
	Fragment.showUnseenIf("bosmer-main.option.notes", Fragment.seen("bosmer-board-main.option.analyse"))
	Fragment.setSeenIf("bosmer-main.option.patterns", Dialog.seen("bosmer-info", ["bosmer-info.option.back"]))
	return Utils.walkToPoint(PointId["office-bosmer"])
})

scripts.register("fragmentInvoke", FragmentId["bosmer-main.option.mirror"], value => {
	if (value == "open") {
		Inventory.open("mirror")
	} else {
		Inventory.close()
		storage.bosmer.seenMirror = true
	}
})

scripts.register("fragmentInvoke", FragmentId["bosmer-main.option.mirror-2"], value => {
	if (value == "open") {
		Inventory.open("mirror")
	} else if (value == "close")  {
		Inventory.close()
	} else {
		Inventory.replace("mirror", "watcher", true)
	}
})

scripts.register("dialogStart", DialogId["bosmer-info"], () => Fragment.executeIfUnseen("bosmer-info-intro"))

scripts.register("dialogStart", DialogId["bosmer-board-main"], () => Fragment.executeIfUnseen("bosmer-board-intro"))

scripts.register("fragmentInvoke", FragmentId["bosmer-board-main.option.take"], Inventory.equipHandler("scribbles"))

Debug.registerTestChest("office", ["mirror"])
