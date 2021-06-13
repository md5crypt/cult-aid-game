scripts.register("mapLoad", MapId["boiler"], () => {
	context.map.cells.forEach(cell => cell.visible = true)
	context.player.setMapPosition(...Utils.getPoint(PointId["boiler-spawn"]))
})

scripts.register("zoneUse", ZoneId["boiler-exit"], async () => {
	await context.map.loadMap(MapId["main"])
	context.player.setMapPosition(...Utils.getPoint(PointId["plantation-hatch"]))
})

scripts.register("zoneUse", ZoneId["boiler-atronach"], () => {
	if (Fragment.unseen("atronach-initial.option.etch-a-sketch")) {
		return Dialog.execute("atronach-initial")
	} else if (Fragment.unseen("atronach-main.option.scam")) {
		return Dialog.execute("atronach-main")
	} else {
		return Dialog.execute("atronach-final")
	}
})

scripts.register("dialogStart", DialogId["atronach-initial"], () => {
	Fragment.setVisibility("atronach-initial.option.etch-a-sketch", Inventory.has("etchASketch"))
	return Fragment.executeIfUnseen("atronach-intro")
})

scripts.register("fragmentInvoke", FragmentId["atronach-initial.option.etch-a-sketch"], Inventory.unEquipHandler("etchASketch"))

scripts.register("dialogStart", DialogId["atronach-final"], () => {
	Fragment.setVisibility("atronach-final.option.mirror", Inventory.has("watcher"))
})

scripts.register("fragmentInvoke", FragmentId["atronach-final.option.mirror"], async value => {
	switch (value) {
		case "open":
			Inventory.open("watcher")
			break
		case "close":
			Inventory.close()
			break
	}
})

Debug.registerTestChest("boiler", ["watcher", "etchASketch"])
