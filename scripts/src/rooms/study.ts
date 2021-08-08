import {
	Item,
	Fragment,
	Dialog,
	Inventory,
	Utils,
	Zone,
	Path,
	Player
} from "../api"

Dialog.onStart("hobo-common", () => {
	Fragment.showUnseenIf("hobo-common.option.why-hobo", Fragment.seen("hobo-kitchen-intro"))
	Fragment.showUnseenIf("hobo-common.option.chef", storage.plantation.visited)
	Fragment.showUnseenIf("hobo-common.option.librarian", Fragment.seen("librarian-intro"))
})

Dialog.onStart("hobo-kitchen", () => {
	Fragment.showIf("hobo-kitchen.option.booze", Inventory.has("mead") && Fragment.seen("hobo-kitchen.option.cut-chase"))
	Fragment.showIf("hobo-kitchen.option.unmask", Fragment.seen("technician-info.option.hobo"))
	Fragment.pushIfUnseen("hobo-kitchen-intro")
})

Dialog.onStart("hobo-study", () => {
	Fragment.showIf("hobo-study.option.booze", Inventory.has("mead") && Fragment.seen("hobo-kitchen.option.cut-chase"))
	Fragment.showUnseenIf("hobo-study.option.mural", Fragment.seen("maid-final"))
	Fragment.showUnseenIf("hobo-study.option.apprenticeship", Fragment.seen("hobo-study-pizza-part-2"))
	if (Fragment.unseen("hobo-kitchen-intro")) {
		// if we never talked to him in the kitchen before this is the only possible intro
		Fragment.pushIfUnseen("hobo-study-post-maid-intro")
		return
	}
	// check if we should show the spirit intro
	if (Fragment.seen("hobo-study-pizza-part-1") && Fragment.unseen("hobo-study-pizza-part-2")) {
		Fragment.pushIfUnseen("hobo-study-pizza-part-2")
		if (Fragment.seen("hobo-kitchen.option.unmask")) {
			// skip normal unmasked intro if not shown yet
			Fragment.setSeen("hobo-study-intro-unmasked")
		} else {
			// show normal intro first
			Fragment.pushIfUnseen("hobo-study-intro")
		}
		return
	}
	// "normal" intros
	Fragment.pushIfUnseen(Fragment.seen("hobo-kitchen.option.unmask") ? "hobo-study-intro-unmasked" : "hobo-study-intro")
})

Fragment.onInvoke("hobo-kitchen.option.booze", async value => {
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
			Item.hide("kitchen-hobo")
			break
	}
})

Fragment.onInvoke("hobo-study.option.booze", async value => {
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

Fragment.onInvoke("hobo-study.option.medallion", Inventory.equipHandler("medallion"))

Zone.onUse("study-desk-front", async () => {
	await Player.walkToPoint(Path.get("study-desk").lastPoint)
	void Dialog.execute("hobo-study")
})

Zone.onUse("study-desk-back", async () => {
	await Player.executePath("study-desk", "walk")
	void Dialog.execute("hobo-study")
})
