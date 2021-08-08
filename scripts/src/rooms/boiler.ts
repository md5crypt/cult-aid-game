import {
	Region,
	Player,
	Fragment,
	Dialog,
	Inventory,
	Zone,
	Debug
} from "../api"

Region.onLoad("boiler", () => {
	Region.show()
	Player.moveToPoint("boiler-spawn")
})

Zone.onUse("boiler-exit", async () => {
	await Region.load("main")
	Player.moveToPoint("plantation-hatch")
})

Zone.onUse("boiler-atronach", () => {
	if (Fragment.unseen("atronach-initial.option.etch-a-sketch")) {
		return Dialog.execute("atronach-initial")
	} else if (Fragment.unseen("atronach-main.option.scam")) {
		return Dialog.execute("atronach-main")
	} else {
		return Dialog.execute("atronach-final")
	}
})

Dialog.onStart("atronach-initial", () => {
	Fragment.setVisibility("atronach-initial.option.etch-a-sketch", Inventory.has("etchASketch"))
	Fragment.pushIfUnseen("atronach-intro")
})

Fragment.onInvoke("atronach-initial.option.etch-a-sketch", Inventory.unEquipHandler("etchASketch"))

Dialog.onStart("atronach-final", () => {
	Fragment.setVisibility("atronach-final.option.mirror", Inventory.has("watcher"))
})

Fragment.onInvoke("atronach-final.option.mirror", async value => {
	switch (value) {
		case "open":
			Inventory.open("watcher")
			break
		case "close":
			Inventory.close()
			break
	}
})

Debug.registerTestChest("boiler", ["watcher", "etchASketch"])
