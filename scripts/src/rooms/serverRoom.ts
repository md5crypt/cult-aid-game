import {
	Fragment,
	Dialog,
	Inventory,
	Zone
} from "../api"

Dialog.onStart("technician-main", () => {
	Fragment.showIf("technician-main.option.book", Inventory.has("book") && Fragment.seen("technician-main.option.reading"))
	Fragment.setVisibility("technician-main.option.sweetroll", Inventory.has("sweetroll"))
	Fragment.pushIfUnseen("technician-intro")
})

Fragment.onInvoke("technician-main.option.book", Inventory.unEquipHandler("book"))

Zone.onUse("server-technician", () => {
	void Dialog.execute("technician-main")
})

Zone.onUse("server-power-supply", () => {
	void Fragment.execute("technician-touch-server")
})
