import {
	Player,
	Fragment,
	Dialog,
	Inventory,
	Zone,
	Debug
} from "../api"

Zone.onEnter("tunnel", async () => {
	if (Fragment.unseen("thief-pre-intro")) {
		await Player.executePath("tunnel-entrance")
		await Fragment.execute("thief-pre-intro")
	}
})

Fragment.onInvoke("thief-pre-intro", () => {
	// todo
})

Zone.onUse("tunnel-loot", () => {
	if (Fragment.seen("thief-main.option.sweetroll")) {
		return Dialog.execute("thief-loot")
	} else if (Fragment.unseen("thief-intro")) {
		return Fragment.execute("thief-loot-pre")
	} else if (Fragment.unseen("thief-main.option.food")) {
		return Fragment.execute("thief-loot-deny")
	} else if (Fragment.unseen("thief-fed.option.loot")) {
		return Fragment.execute("thief-loot-ask")
	} else {
		return Dialog.execute("thief-loot")
	}
})

Zone.onUse("tunnel-thief", () => {
	if (Fragment.seen("thief-main.option.sweetroll")) {
		return Fragment.execute("thief-knocked-out")
	} else if (Fragment.unseen("thief-main.option.food")) {
		return Dialog.execute("thief-main")
	} else if (Fragment.unseen("thief-end-intro")) {
		return Dialog.execute("thief-fed")
	} else {
		return Dialog.execute("thief-end")
	}
})

Dialog.onStart("thief-main", async () => {
	await Player.walkToPoint("tunnel-thief")
	Fragment.setVisibility("thief-main.option.sweetroll", Inventory.has("sweetroll"))
	Fragment.setVisibility("thief-main.option.food", Inventory.has("food"))
	Fragment.setVisibility("thief-main.option.shovel", Inventory.has("shovel") && Fragment.seen("thief-main.option.wrong"))
	Fragment.pushIfUnseen("thief-intro")
})

Dialog.onStart("thief-fed", () => {
	Fragment.setVisibility("thief-fed.option.shovel", Inventory.has("shovel") && Fragment.unseen("thief-main.option.shovel"))
	Fragment.setVisibility("thief-fed.option.shovel-alt", Inventory.has("shovel") && Fragment.seen("thief-main.option.shovel"))
})

Dialog.onStart("thief-end", () => Fragment.pushIfUnseen("thief-end-intro"))

Fragment.onInvoke("thief-main.option.sweetroll", Inventory.unEquipHandler("sweetroll", value => {
	switch (value) {
		case "eat":
			// todo
			break
		case "fall":
			// todo
	}
}))

Fragment.onInvoke("thief-main.option.food", Inventory.unEquipHandler("food", () => {
	// todo
}))

Fragment.onInvoke("thief-end.option.leave", () => {
	// todo
})

Fragment.onInvoke("thief-loot.option.take", Inventory.equipHandler("etchASketch"))

Fragment.onInvoke(["thief-fed.option.shovel", "thief-fed.option.shovel-alt"], Inventory.unEquipHandler("shovel"))

Fragment.onInvoke("thief-main.option.shovel", Inventory.presentHandler("shovel"))

Fragment.onInvoke("thief-fed.option.sweetroll", Inventory.presentHandler("sweetroll"))

Debug.registerTestChest("tunnel", ["shovel", "food", "sweetroll"])
