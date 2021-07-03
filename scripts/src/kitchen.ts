scripts.register("zoneUse", ZoneId["kitchen-chef"], async () => {
	context.player.lockInput()
	await Utils.walkToPoint(PointId["kitchen-chef"])
	context.player.unlockInput()
	return Dialog.execute("chef-main")
})

scripts.register("dialogStart", DialogId["chef-main"], async () => {
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
	return Dialog.execute(Fragment.seen("hobo-kitchen.option.unmask") ? "hobo-kitchen-unmasked" : "hobo-kitchen")
})

