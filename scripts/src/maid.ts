Dialog.onStart("maid-main", () => {
	Fragment.pushIfUnseen("maid-main-intro")
	Fragment.setVisibility("maid-main.option.article", Inventory.has("newspaper"))
	Fragment.setVisibility("maid-main.option.inscription", Inventory.has("inscription"))
	Fragment.setVisibilityIfUnseen("maid-main.option.archaeologist", storage.archeologist.visited)
	Fragment.setVisibilityIfUnseen("maid-main.option.idea", Fragment.seen("maid-main.option.article", "maid-main.option.archaeologist"))
})

Fragment.onInvoke("maid-main.option.article", Inventory.unEquipHandler("newspaper"))
Fragment.onInvoke("maid-main.option.inscription", Inventory.unEquipHandler("inscription"))

Fragment.onInvoke("maid-final", value => {
	switch (value) {
		// todo: other switch-cases
		case "directions":
			if (Fragment.unseen("hobo-study-intro", "hobo-study-intro-unmasked")) {
				Fragment.push("maid-final-directions")
			}
			break
	}
})
