scripts.register("dialogStart", DialogId["hobo-common"], () => {
	Fragment.showUnseenIf("hobo-common.option.why-hobo", Fragment.seen("hobo-kitchen-intro"))
	Fragment.showUnseenIf("hobo-common.option.chef", storage.plantation.visited)
	Fragment.showUnseenIf("hobo-common.option.librarian", Fragment.seen("librarian-intro"))
})

scripts.register("dialogStart", DialogId["hobo-kitchen"], () => {
	Fragment.showIf("hobo-kitchen.option.booze", Inventory.has("mead") && Fragment.seen("hobo-kitchen.option.cut-chase"))
	Fragment.showIf("hobo-kitchen.option.unmask", Fragment.seen("technician-info.option.hobo"))
	return Fragment.executeIfUnseen("hobo-kitchen-intro")
})

scripts.register("dialogStart", DialogId["hobo-study"], async () => {
	Fragment.showIf("hobo-study.option.booze", Inventory.has("mead") && Fragment.seen("hobo-kitchen.option.cut-chase"))
	Fragment.showUnseenIf("hobo-study.option.mural", storage.maid.needsInscription)
	Fragment.showUnseenIf("hobo-study.option.apprenticeship", Fragment.seen("hobo-study-pizza-part-2"))
	if (Fragment.unseen("hobo-kitchen-intro")) {
		// if we never talked to him in the kitchen before this is the only possible intro
		return Fragment.executeIfUnseen("hobo-study-post-maid-intro")
	}
	// check if we should show the spirit intro
	if (Fragment.seen("hobo-study-pizza-part-1") && Fragment.unseen("hobo-study-pizza-part-2")) {
		if (Fragment.seen("hobo-kitchen.option.unmask")) {
			// skip normal unmasked intro if not shown yet
			Fragment.setSeen("hobo-study-intro-unmasked")
		} else {
			// show normal intro first
			await Fragment.executeIfUnseen("hobo-study-intro")
		}
		return Fragment.execute("hobo-study-pizza-part-2")
	}
	// "normal" intros
	return Fragment.executeIfUnseen(Fragment.seen("hobo-kitchen.option.unmask") ? "hobo-study-intro-unmasked" : "hobo-study-intro")
})

scripts.register("fragmentInvoke", FragmentId["hobo-kitchen.option.booze"], async value => {
	switch (value) {
		case "open":
			Inventory.open("mead")
			break
		case "look-around":
			// to-do
			break
		case "search":
			// to-do
			break
		case "replace":
			Inventory.replace("mead", "necrocomm", true)
			break
		case "close":
			Inventory.close()
			break
		case "leave":
			// to-do
			await Utils.blackScreen(250)
			context.map.getObject<"item">(ItemId["kitchen-hobo"]).enabled = false
			break
	}
})

scripts.register("fragmentInvoke", FragmentId["hobo-study.option.booze"], async value => {
	switch (value) {
		case "open-mead":
			Inventory.open("mead")
			break
		case "search":
			// to-do
			break
		case "open-mead":
			Inventory.open("necrocomm")
			break
		case "close":
			Inventory.close()
			break
	}
})

scripts.register("fragmentInvoke", FragmentId["hobo-study.option.medallion"], Inventory.equipHandler("medallion"))
