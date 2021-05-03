scripts.register("zoneUse", ZoneId["kitchen-chef"], async () => {
	context.player.lockInput()
	const point = context.map.getObject<"point">(PointId["kitchen-chef"])
	await context.player.pushPath(utils.twoPointPath(context.player.getAbsoluteLocation(), point.position)).onEnd.promise()
	context.player.unlockInput()
	utils.executeDialog("chef-main")
})

scripts.register("dialogStart", DialogId["chef-main"], async () => {
	await utils.executeIfUnseen("chef-intro")
})

scripts.register("fragmentInvoke", FragmentId["chef-intro"], async () => {
	const point = context.map.getObject<"point">(PointId["kitchen-table"])
	context.player.moveTo(...point.position)
	await utils.blackScreen(1000)
})

scripts.register("zoneUse", ZoneId["kitchen-hobo"], async () => {
	utils.executeFragment("test-character.option.hobo")
})
