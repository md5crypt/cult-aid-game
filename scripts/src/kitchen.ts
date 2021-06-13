scripts.register("zoneUse", ZoneId["kitchen-chef"], async () => {
	context.player.lockInput()
	await Utils.walkToPoint(PointId["kitchen-chef"])
	context.player.unlockInput()
	return Dialog.execute("chef-main")
})

scripts.register("dialogStart", DialogId["chef-main"], async () => {
	if (!Fragment.seen("chef-intro")) {
		await Fragment.execute("chef-intro")
	} else if (!Fragment.seen("chef-post-intro")) {
		await Fragment.execute("chef-post-intro")
	}
	Fragment.setVisibility("chef-main.option.make-food",
		Fragment.unseen("chef-main.option.make-food") &&
		storage.thief.visited &&
		!storage.thief.knockedOut
	)
	Fragment.showUnseenIf("chef-main.option.make-food", storage.thief.visited && !storage.thief.knockedOut)
	Fragment.showIf("chef-main.option.breeder", storage.chef.isBreeder)
	Fragment.setVisibility("chef-main.option.door", storage.plantation.seenDoor && !storage.plantation.visited)
	Fragment.showIf("chef-main.option.plantation", storage.plantation.visited)
})

scripts.register("fragmentInvoke", FragmentId["chef-intro"], async () => {
	const point = context.map.getObject<"point">(PointId["kitchen-table"])
	context.player.moveTo(...point.position)
	await Utils.blackScreen(1000)
})

scripts.register("fragmentInvoke", FragmentId["chef-main.option.make-food"], async () => {
	await Utils.blackScreen(1000)
})

scripts.register("fragmentInvoke", FragmentId["chef-main.option.take-food"], Inventory.equipHandler("food"))

scripts.register("fragmentInvoke", FragmentId["chef-main.option.take-sweetroll"], Inventory.equipHandler("sweetroll"))

scripts.register("fragmentInvoke", FragmentId["chef-main.option.plantation"], async () => {
	// todo
})

scripts.register("zoneUse", ZoneId["kitchen-hobo"], () => {
	return Fragment.execute("test-character.option.hobo")
})
