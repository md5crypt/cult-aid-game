scripts.register("mapLoad", MapId["boiler"], () => {
	context.map.cells.forEach(cell => cell.visible = true)
	context.player.setMapPosition(...Utils.getPoint(PointId["boiler-spawn"]))
})

scripts.register("zoneUse", ZoneId["boiler-exit"], async () => {
	await context.map.loadMap(MapId["main"])
	context.player.setMapPosition(...Utils.getPoint(PointId["plantation-hatch"]))
})

scripts.register("zoneUse", ZoneId["boiler-atronach"], () => Fragment.execute("todo"))
