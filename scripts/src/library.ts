scripts.register("fragmentInvoke", FragmentId["librarian-enter-library"], async () => {
	// todo
})

scripts.register("fragmentInvoke", FragmentId["librarian-newspaper-maid"], async () => {
	// todo
})

scripts.register("dialogStart", DialogId["librarian-body"], async () => {
	if (!storage.dialog.seen["librarian-body-intro"]) {
		await context.speech.executeFragment(FragmentId["librarian-body-intro"])
	}
})

scripts.register("fragmentAfter", FragmentId["librarian-body.option.take-map"], () => {
	storage.items.map = true
})

scripts.register("fragmentInvoke", FragmentId["librarian-sweetroll.option.do-nothing"], () => {
	// todo
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.chef"], async () => {
	await utils.blackScreen(500) // todo
})

scripts.register("fragmentAfter", FragmentId["librarian-fetch.option.chef"], () => {
	// todo
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.librarian"], async () => {
	await utils.blackScreen(500) // todo
})

scripts.register("fragmentAfter", FragmentId["librarian-fetch.option.librarian"], () => {
	// todo
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.maid"], async () => {
	await utils.blackScreen(500) // todo
})

scripts.register("fragmentAfter", FragmentId["librarian-fetch.option.maid"], () => {
	// todo
})

scripts.register("fragmentInvoke", FragmentId["librarian-fetch.option.mage"], async () => {
	await utils.blackScreen(500) // todo
})

scripts.register("fragmentAfter", FragmentId["librarian-fetch.option.mage"], () => {
	// todo
})

scripts.register("dialogStart", DialogId["librarian-newspaper-select"], () => {
	storage.dialog.hidden["librarian-newspaper-select.option.chef"] = !storage.dialog.hidden["librarian-fetch.option.chef"]
	storage.dialog.hidden["librarian-newspaper-select.option.librarian"] = !storage.dialog.hidden["librarian-fetch.option.librarian"]
	storage.dialog.hidden["librarian-newspaper-select.option.mage"] = !storage.dialog.hidden["librarian-fetch.option.mage"]
	storage.dialog.hidden["librarian-newspaper-select.option.maid"] = !storage.dialog.hidden["librarian-fetch.option.maid"]
})

scripts.register("dialogSelect", DialogId["librarian-newspaper-select"], option => {
	// todo
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
	if (!storage.dialog.seen["librarian-intro"]) {
		await context.speech.executeFragment(FragmentId["librarian-intro"])
	}
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


