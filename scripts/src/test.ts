const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sit hoc ultimum bonorum, quod nunc a me defenditur; Et quidem, inquit, vehementer errat; Quodsi vultum tibi, si incessum fingeres, quo gravior viderere, non esses tui similis; Sin tantum modo ad indicia veteris memoriae cognoscenda, curiosorum. Nonne videmus quanta perturbatio rerum omnium consequatur, quanta confusio? Hoc tu nunc in illo probas.
Ita relinquet duas, de quibus etiam atque etiam consideret. Quid ergo aliud intellegetur nisi uti ne quae pars naturae neglegatur? Nulla erit controversia. Color egregius, integra valitudo, summa gratia, vita denique conferta voluptatum omnium varietate. Si verbum sequimur, primum longius verbum praepositum quam bonum. Ergo in gubernando nihil, in officio plurimum interest, quo in genere peccetur. Itaque quantum adiit periculum! ad honestatem enim illum omnem conatum suum referebat, non ad voluptatem. Tu vero, inquam, ducas licet, si sequetur;
Quem si tenueris, non modo meum Ciceronem, sed etiam me ipsum abducas licebit. Duo Reges: constructio interrete. Tum Piso: Quoniam igitur aliquid omnes, quid Lucius noster? Nos paucis ad haec additis finem faciamus aliquando; Tu autem inter haec tantam multitudinem hominum interiectam non vides nec laetantium nec dolentium? Re mihi non aeque satisfacit, et quidem locis pluribus.`

const testDialog1 = NPC.zombii.ask({
	prompt: "So what do you want to talk about with good old dead me?",
	options: [
		{
			text: "Can you help me get the hell out of here?",
			action: [
				NPC.khajiit.say("Can you somehow help me escape this shitty cave? Pretty plz?"),
				NPC.zombii.say("Oh, oh, the outside. It's overrated."),
				NPC.khajiit.say("I still want to get out, can you help?"),
				context.Speech.push(NPC.zombii.ask({
					prompt: "I guess, what do you want to know?",
					options: [
						{
							text: "How. To. Get. Out. Of. Here.",
							action: [
								NPC.khajiit.say("Like I said, how to get out of this cursed cave."),
								NPC.zombii.say("Oh, it's not cursed. Or are you saying I am cursed?"),
								NPC.khajiit.say("Your a fucking zombii."),
								NPC.zombii.say("Dude, you spell it \"you're\". I don't want to talk with you anymore"),
								context.Speech.exit()
							]
						},
						{
							text: "How to make a sweetroll.",
							action: [
								NPC.khajiit.say("Apperenlty I just want to know how to make a sweetroll."),
								NPC.zombii.say("Oh, Oh! A tricky one!. You take some sweet and you roll it unitl you get yourself a sweetroll. The same logic applies to bedrolls"),
								NPC.khajiit.say("...")
							]
						},
						{
							text: "Eh, forget it.",
							action: [
								NPC.khajiit.say("You've been very helpfull, thank you."),
								NPC.zombii.say("Gee, thanks!"),
								context.Speech.pop()
							]
						}
					]
				}))
			]
		},
		{
			text: "Say lorem ipsum to test stuff.",
			action: [
				NPC.zombii.say(lorem)
			]
		},
		{
			text: "Do it again.",
			action: [
				NPC.khajiit.say(lorem)
			]
		},
		{
			text: "I have to go.",
			action: [
				NPC.khajiit.say("It was 'fun' talking to you but I have to go."),
				NPC.zombii.say("Sure, sure, go see some ppl that are 'alive'."),
				context.Speech.exit()
			]
		}
	]
})

scripts.register("test", "cellUse", (_cell) => {
	void context.camera.shake(1000)
})

scripts.register("placePlayer", "cellCreate", async (cell) => {
	context.player.enable(cell.x, cell.y)
	context.camera.lockOn(context.player)
	void context.Speech.start(testDialog1)
	//await ppl.zombii.say(lorem)
	//await ppl.zombii.say("fuck it then.")
})

scripts.register("trap", "cellEnter", async (cell) => {
	const {camera, player, map} = context
	player.lockInput()
	void camera.moveTo(
		(cell.x * CONST.GRID_BASE) + (CONST.GRID_BASE >> 1),
		(cell.y * CONST.GRID_BASE) + (CONST.GRID_BASE >> 1),
		500
	)
	void camera.zoomTo(camera.zoomCell, 500)
	await player.waitWalkEnd()
	player.setTexture(context.Sprite.find("khajiit-idle"), null)
	const animation = new context.Animation([
		["sequence", 0, 5],
		["invoke", "spider"],
		["sequence", 6, 11]
	], 200)
	animation.onInvoke.add(() => {
		const spider = context.Item.create("spider-attack")
		const animation = new context.Animation([
			["sequence", 0, 1],
			["invoke", "shake"],
			["sequence", 2, 6],
			["frame", 7, 0]
		], 200)
		animation.onEnd.add(async () => {
			player.cell.addItem(context.Item.create("spider-web"))
			await context.timer.wait(200)
			camera.enabled = false
			player.cell.clearItems()
			map.getCellByName("init-room").addItem(player)
			player.setTexture(player.walkSequence.idle)
			camera.zoom = camera.zoomDefault
			camera.lockOn(player)
			map.cells.forEach(cell => cell.visible = false)
			map.getCellByName("init-room").visible = true
			await context.timer.wait(500)
			player.unlockInput()
			camera.enabled = true
		})
		animation.onInvoke.add(() => (camera.shake(400, 1), false))
		spider.setAnimation(animation)
		player.cell.addItem(spider)
		return true
	})
	player.setTexture(context.Sprite.find("khajiit-spider"), animation)
})
