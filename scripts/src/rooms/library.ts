import {
	Region,
	Player,
	Fragment,
	Dialog,
	Inventory,
	Zone,
	Utils,
	Item,
	Path
} from "../api"

Fragment.onInvoke("librarian-enter-library", async () => {
	Dialog.hidden = true
	await Player.executePath("library-retreat")
	Dialog.hidden = false
})

Dialog.onStart("librarian-body", () => Fragment.pushIfUnseen("librarian-body-intro"))

Fragment.onInvoke("librarian-body.option.take-map", Inventory.equipHandler("map"))

Fragment.onInvoke("librarian-main.option.sweetroll", () => Inventory.open())

Fragment.onInvoke("librarian-sweetroll.option.do-nothing", Inventory.unEquipHandler("sweetroll", value => {
	// todo: animation
}))

Fragment.onInvoke("librarian-fetch.option.chef", async (state) => {
	if (state == "wait") {
		await Utils.blackScreen(500) // todo
	} else {
		Dialog.hidden = true
		await context.ui.newspaper.open()
		Dialog.hidden = false
	}
})

Fragment.onInvoke("librarian-fetch.option.librarian", async (state) => {
	if (state == "wait") {
		await Utils.blackScreen(500) // todo
	} else {
		Dialog.hidden = true
		await context.ui.newspaper.open()
		Dialog.hidden = false
	}
})

Fragment.onInvoke("librarian-fetch.option.mage", async (state) => {
	if (state == "wait") {
		await Utils.blackScreen(500) // todo
	} else {
		Dialog.hidden = true
		await context.ui.newspaper.open()
		Dialog.hidden = false
	}
})

Fragment.onInvoke("librarian-fetch.option.maid", async (state) => {
	switch (state) {
		case "wait":
			return Utils.blackScreen(500) // todo
		case "show":
			Dialog.hidden = true
			await context.ui.newspaper.open(true)
			Dialog.hidden = false
			break
		case "hide":
			context.ui.newspaper.enabled = false
			break
	}
})

Fragment.onAfter("librarian-newspaper-read-end", async () => {
	await Player.executePath("library-newspapers")
	storage.library.newspapers = true
	Item.show("library-newspapers")
})

Dialog.onStart("librarian-newspaper-select", () => {
	Fragment.setVisibility("librarian-newspaper-select.option.chef", Fragment.seen("librarian-fetch.option.chef"))
	Fragment.setVisibility("librarian-newspaper-select.option.librarian", Fragment.seen("librarian-fetch.option.librarian"))
	Fragment.setVisibility("librarian-newspaper-select.option.mage", Fragment.seen("librarian-fetch.option.mage"))
	Fragment.setVisibility("librarian-newspaper-select.option.maid", Fragment.seen("librarian-fetch.option.maid"))
})

Dialog.onSelect("librarian-newspaper-select", async option => {
	if (option != "exit") {
		Dialog.hidden = true
		await context.ui.newspaper.open()
		Dialog.hidden = false
	}
})

Dialog.onStart("librarian-main", () => {
	Fragment.setVisibility("librarian-main.option.sweetroll", Fragment.unseen("librarian-main.option.sweetroll") && Inventory.has("sweetroll"))
	Fragment.setVisibility("librarian-main.option.scribbles", Inventory.has("scribbles"))
	Fragment.showIf("librarian-main.option.vampire", Fragment.seen("librarian-main.option.cultists", "librarian-main.option.live-here"))
	Fragment.showUnseenIf("librarian-main.option.archaeologist", storage.archeologist.visited)
	Fragment.showUnseenIf("librarian-main.option.inscription", Fragment.seen("librarian-main.option.dwemer", "maid-main.option.idea"))
	Fragment.setVisibility("librarian-main.option.newspapers", Fragment.seen("librarian-main.option.scribbles"))
	Fragment.setSeenIf("librarian-main.option.newspapers", Dialog.seen("librarian-fetch", ["librarian-fetch.option.back"]))
	Fragment.pushIfUnseen("librarian-intro")
})

Fragment.onInvoke("librarian-main.option.scribbles", Inventory.unEquipHandler("scribbles"))

Fragment.onInvoke("librarian-main.option.copy", Inventory.equipHandler("newspaper"))

Fragment.onInvoke("librarian-main.option.copy", async () => {
	await Utils.blackScreen(500) // todo
})

Fragment.onInvoke("librarian-main.option.key", Inventory.equipHandler("key"))

Fragment.onInvoke("librarian-main.option.take-inscription", Inventory.equipHandler("inscription"))


Fragment.onInvoke("forbidden-section-enter-attempt", async token => {
	switch (token) {
		case "walk-in":
			Dialog.hidden = true
			await Player.executePath("library-darkness-entry")
			await Utils.wait(1000)
			Dialog.hidden = false
			break
		case "inside":
			Dialog.hidden = true
			await Utils.wait(1000)
			Dialog.hidden = false
			break
		case "walk-out":
			Dialog.hidden = true
			await Player.executePath("library-darkness-retreat")
			Dialog.hidden = false
			break
	}
})

Fragment.onInvoke("forbidden-section-enter", async () => {
	Dialog.hidden = true
	await Player.executePath("library-darkness-entry")
	await Region.load("forbidden-section")
	Dialog.hidden = false
})

Zone.onEnter("library-darkness", async () => {
	if (Inventory.has("map")) {
		if (!storage.dialog.seen["forbidden-section-enter"]) {
			Fragment.pushIfUnseen("forbidden-section-enter")
		} else {
			Player.lockInput()
			await Player.executePath("library-darkness-entry")
			await Region.load("forbidden-section")
			Player.unlockInput()
		}
	} else {
		if (!storage.dialog.seen["forbidden-section-enter-attempt"]) {
			Fragment.pushIfUnseen("forbidden-section-enter-attempt")
		} else {
			Fragment.pushIfUnseen("forbidden-section-enter-deny")
		}
	}
})

Zone.onUse("library-librarian", async () => {
	await Player.walkToPoint(Path.get("library-newspapers").firstPoint)
	if (Fragment.seen("librarian-sweetroll.option.do-nothing")) {
		await Dialog.execute("librarian-body")
	} else {
		await Dialog.execute("librarian-main")
	}
})

Zone.onEnter("library-entrance", async () => {
	if (Fragment.unseen("librarian-enter-library")) {
		Region.showCellGroup()
		await Player.executePath("library-enter")
		await Fragment.execute("librarian-enter-library")
	}
})

Zone.onUse("library-newspapers", async () => {
	if (storage.library.newspapers) {
		await Dialog.execute("librarian-newspaper-select")
	}
})

Region.onLoad("main", () => {
	Item.setVisibility("library-newspapers", storage.library.newspapers)
})
