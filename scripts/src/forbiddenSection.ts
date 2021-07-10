Region.onLoad("forbidden-section", () => {
	Region.show()
	return Player.executePath("forbidden-section-enter", true)
})

Zone.onEnter("forbidden-section-exit", async () => {
	Player.lockInput()
	await Player.executePath("forbidden-section-exit")
	await Region.load("main")
	await Player.executePath("library-darkness-exit", true)
	Player.unlockInput()
})

Zone.onUse("forbidden-section-bookshelf", () => Dialog.execute("forbidden-section-bookshelf"))

Dialog.onStart("forbidden-section-bookshelf", async () => {
	Fragment.showIf("forbidden-section-bookshelf.option.exit-normal", Fragment.unseen("librarian-fetch.option.librarian"))
	Fragment.showUnseenIf("forbidden-section-bookshelf.option.exit-newspaper", Fragment.seen("librarian-fetch.option.librarian"))
	await Fragment.executeIfUnseen("forbidden-section-bookshelf-intro")
})

Fragment.onAfter("forbidden-section-bookshelf.option.view-newspaper", async () => {
	Dialog.hidden = true
	await context.ui.newspaper.open()
	Dialog.hidden = false
})
