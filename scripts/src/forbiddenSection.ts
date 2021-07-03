scripts.register("mapLoad", MapId["forbidden-section"], async () => {
	context.map.cells.forEach(cell => cell.visible = true)
	const path = context.map.getObject<"path">(PathId["forbidden-section-enter"])
	context.player.setMapPosition(...path.position)
	await Utils.executePath(path)
})

scripts.register("zoneEnter", ZoneId["forbidden-section-exit"], async () => {
	context.player.lockInput()
	await Utils.executePath(PathId["forbidden-section-exit"])
	await context.map.loadMap(MapId["main"])
	const path = context.map.getObject<"path">(PathId["library-darkness-exit"])
	context.player.setMapPosition(...path.position)
	await Utils.executePath(path)
	context.player.unlockInput()
})

scripts.register("zoneUse", ZoneId["forbidden-section-bookshelf"], () => Dialog.execute("forbidden-section-bookshelf"))

scripts.register("dialogStart", DialogId["forbidden-section-bookshelf"], async () => {
	Fragment.showIf("forbidden-section-bookshelf.option.exit-normal", Fragment.unseen("librarian-fetch.option.librarian"))
	Fragment.showUnseenIf("forbidden-section-bookshelf.option.exit-newspaper", Fragment.seen("librarian-fetch.option.librarian"))
	await Fragment.executeIfUnseen("forbidden-section-bookshelf-intro")
})

scripts.register("fragmentAfter", FragmentId["forbidden-section-bookshelf.option.view-newspaper"], async () => {
	context.ui.dialog.hide()
	await context.ui.newspaper.open()
	context.ui.dialog.show()
})
