Zone.onUse("kitchen-chef", async () => {
	await Player.walkToPoint("kitchen-chef")
	return Dialog.execute("chef-main")
})

Dialog.onStart("chef-main", async () => {
	if (Fragment.unseen("chef-intro")) {
		await Fragment.execute("chef-intro")
	} else if (Fragment.unseen("chef-post-intro")) {
		await Fragment.execute("chef-post-intro")
	}
	Fragment.showUnseenIf("chef-main.option.make-food", Fragment.seen("thief-intro") && Fragment.unseen("thief-main.option.sweetroll"))
	Fragment.showUnseenIf("chef-main.option.breeder", Fragment.seen("bosmer-info.option.chef"))
	Fragment.setVisibility("chef-main.option.door", storage.plantation.seenDoor && !storage.plantation.visited)
	Fragment.showIf("chef-main.option.plantation", storage.plantation.visited)
})

Fragment.onInvoke("chef-intro", async () => {
	Player.moveToPoint("kitchen-table")
	await Utils.blackScreen(1000)
})

Fragment.onInvoke("chef-main.option.make-food", async () => {
	await Utils.blackScreen(1000)
})

Fragment.onInvoke("chef-main.option.take-food", Inventory.equipHandler("food"))

Fragment.onInvoke("chef-main.option.take-sweetroll", Inventory.equipHandler("sweetroll"))

Fragment.onInvoke("chef-main.option.plantation", async () => {
	// todo
})

Zone.onUse("kitchen-hobo", () => {
	return Dialog.execute(Fragment.seen("hobo-kitchen.option.unmask") ? "hobo-kitchen-unmasked" : "hobo-kitchen")
})
