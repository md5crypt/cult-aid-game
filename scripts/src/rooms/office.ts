import {
	Region,
	Player,
	Fragment,
	Dialog,
	Inventory,
	Zone,
	Debug
} from "../api"

Zone.onEnter("office-entrance", async () => {
	Region.showCellGroup()
	if (Fragment.unseen("bosmer-intro")) {
		await Player.executePath("office-entrance")
		await Fragment.execute("bosmer-intro")
	}
})

Zone.onUse("office-bosmer", () => Dialog.execute("bosmer-main"))

Zone.onUse("office-board", () => {
	if (Fragment.seen("bosmer-info-intro")) {
		return Dialog.execute("bosmer-board-main")
	} else {
		return Fragment.execute("bosmer-board-deny")
	}
})

Dialog.onStart("bosmer-main", () => {
	Fragment.setVisibility("bosmer-main.option.mirror", Inventory.has("mirror") && Fragment.seen("bosmer-main.option.head-1") && Fragment.unseen("bosmer-main.option.hair"))
	Fragment.setVisibility("bosmer-main.option.mirror-2", Inventory.has("mirror") && Fragment.seen("bosmer-main.option.head-1", "bosmer-main.option.hair"))
	Fragment.showUnseenIf("bosmer-main.option.hair", Fragment.seen("bosmer-main.option.mirror") && Fragment.seen("bosmer-main.option.head-1", "bosmer-info.option.librarian"))
	Fragment.showUnseenIf("bosmer-main.option.notes", Fragment.seen("bosmer-board-main.option.analyse"))
	Fragment.setSeenIf("bosmer-main.option.patterns", Dialog.seen("bosmer-info", ["bosmer-info.option.back"]))
	return Player.walkToPoint("office-bosmer")
})

Fragment.onInvoke("bosmer-main.option.mirror", value => {
	if (value == "open") {
		Inventory.open("mirror")
	} else {
		Inventory.close()
	}
})

Fragment.onInvoke("bosmer-main.option.mirror-2", value => {
	if (value == "open") {
		Inventory.open("mirror")
	} else if (value == "close") {
		Inventory.close()
	} else {
		Inventory.replace("mirror", "watcher", true)
	}
})

Fragment.onAfter("bosmer-main.option.hair", () => {
	if (Inventory.has("mirror")) {
		Dialog.push("bosmer-post-hair")
	}
})

Dialog.onStart("bosmer-info", () => Fragment.pushIfUnseen("bosmer-info-intro"))

Dialog.onStart("bosmer-board-main", () => Fragment.pushIfUnseen("bosmer-board-intro"))

Fragment.onInvoke("bosmer-board-main.option.take", Inventory.equipHandler("scribbles"))

Debug.registerTestChest("office", ["mirror"])
