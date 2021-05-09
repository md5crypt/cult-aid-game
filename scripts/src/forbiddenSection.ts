scripts.register("mapLoad", MapId["forbidden-section"], async () => {
	context.map.cells.forEach(cell => cell.visible = true)
	const path = context.map.getObject<"path">(PathId["forbidden-section-enter"])
	context.player.setMapPosition(...path.position)
	await context.player.pushPath(path.points).onEnd.promise()
})

scripts.register("zoneEnter", ZoneId["forbidden-section-exit"], async () => {
	context.player.lockInput()
	await context.player.pushPath(context.map.getObject<"path">(PathId["forbidden-section-exit"]).points).onEnd.promise()
	await context.map.loadMap(MapId["main"])
	const path = context.map.getObject<"path">(PathId["library-darkness-exit"])
	context.player.setMapPosition(...path.position)
	await context.player.pushPath(path.points).onEnd.promise()
	context.player.unlockInput()
})

scripts.register("zoneUse", ZoneId["forbidden-section-bookshelf"], () => Utils.executeDialog("forbidden-section-bookshelf"))

scripts.register("dialogStart", DialogId["forbidden-section-bookshelf"], async () => {
	storage.dialog.hidden["forbidden-section-bookshelf.option.exit-normal"] = storage.librarian.vampPaperSeen
	storage.dialog.hidden["forbidden-section-bookshelf.option.exit-newspaper"] = !storage.librarian.vampPaperSeen || storage.dialog.seen["forbidden-section-bookshelf.option.exit-newspaper"]
	await Fragment.executeIfUnseen("forbidden-section-bookshelf-intro")
})

scripts.register("fragmentAfter", FragmentId["forbidden-section-bookshelf.option.view-newspaper"], async () => {
	context.ui.dialog.hide()
	await context.ui.newspaper.open()
	context.ui.dialog.show()
})
