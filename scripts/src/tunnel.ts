scripts.register("zoneEnter", ZoneId["tunnel"], async () => {
	if (Fragment.unseen("thief-pre-intro")) {
		await Utils.executePath(PathId["tunnel-entrance"])
		await Fragment.execute("thief-pre-intro")
	}
})

scripts.register("fragmentInvoke", FragmentId["thief-pre-intro"], () => {
	// todo
})

scripts.register("zoneUse", ZoneId["tunnel-loot"], () => {
	if (storage.thief.knockedOut) {
		return Dialog.execute("thief-loot")
	} else if (Fragment.unseen("thief-intro")) {
		return Fragment.execute("thief-loot-pre")
	} else if (Fragment.unseen("thief-main.option.food")) {
		return Fragment.execute("thief-loot-deny")
	} else if (Fragment.unseen("thief-fed.option.loot")) {
		return Fragment.execute("thief-loot-ask")
	} else {
		return Dialog.execute("thief-loot")
	}
})

scripts.register("zoneUse", ZoneId["tunnel-thief"], () => {
	if (storage.thief.knockedOut) {
		return Fragment.execute("thief-knocked-out")
	} else if (Fragment.unseen("thief-main.option.food")) {
		return Dialog.execute("thief-main")
	} else if (Fragment.unseen("thief-end-intro")) {
		return Dialog.execute("thief-fed")
	} else {
		return Dialog.execute("thief-end")
	}
})

scripts.register("dialogStart", DialogId["thief-main"], async () => {
	await Utils.walkToPoint(PointId["tunnel-thief"])
	storage.thief.visited = true
	Fragment.setVisibility("thief-main.option.sweetroll", Inventory.has("sweetroll"))
	Fragment.setVisibility("thief-main.option.food", Inventory.has("food"))
	Fragment.setVisibility("thief-main.option.shovel", Inventory.has("shovel") && Fragment.seen("thief-main.option.wrong"))
	return Fragment.executeIfUnseen("thief-intro")
})

scripts.register("dialogStart", DialogId["thief-fed"], () => {
	Fragment.setVisibility("thief-fed.option.shovel", Inventory.has("shovel") && Fragment.unseen("thief-main.option.shovel"))
	Fragment.setVisibility("thief-fed.option.shovel-alt", Inventory.has("shovel") && Fragment.seen("thief-main.option.shovel"))
})

scripts.register("dialogStart", DialogId["thief-end"], () => Fragment.executeIfUnseen("thief-end-intro"))

scripts.register("fragmentInvoke", FragmentId["thief-main.option.sweetroll"], Inventory.unEquipHandler("sweetroll", value => {
	switch (value) {
		case "eat":
			// todo
			break
		case "fall":
			storage.thief.knockedOut = true
			// todo
	}
}))

scripts.register("fragmentInvoke", FragmentId["thief-main.option.food"], Inventory.unEquipHandler("food", () => {
	// todo
}))

scripts.register("fragmentInvoke", FragmentId["thief-end.option.leave"], () => {
	// todo
})

scripts.register("fragmentInvoke", FragmentId["thief-loot.option.take"], Inventory.equipHandler("etchASketch"))

Debug.registerTestChest("tunnel", ["shovel", "food", "sweetroll"])
