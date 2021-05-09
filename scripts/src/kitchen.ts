scripts.register("zoneUse", ZoneId["kitchen-chef"], async () => {
	context.player.lockInput()
	const point = context.map.getObject<"point">(PointId["kitchen-chef"])
	await context.player.pushPath(Utils.twoPointPath(context.player.getAbsoluteLocation(), point.position)).onEnd.promise()
	context.player.unlockInput()
	return Utils.executeDialog("chef-main")
})

scripts.register("dialogStart", DialogId["chef-main"], async () => {
	if (!Fragment.seen("chef-intro")) {
		await Fragment.execute("chef-intro")
	} else if (!Fragment.seen("chef-post-intro")) {
		await Fragment.execute("chef-post-intro")
	}
	Fragment.showUnseenIf("chef-main.option.make-food", storage.thief.visited)
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
