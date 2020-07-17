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

namespace utils {
	export async function reset() {
		const {camera, player, map} = context
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
	}
}

scripts.register("test", "cellUse", (_cell) => {
	//void context.camera.shake(1000)
	void context.Speech.start(testDialog1)
})

scripts.register("placePlayer", "cellCreate", async (cell) => {
	context.player.enable(cell.x, cell.y)
	context.camera.lockOn(context.player)
	//void context.Speech.start(testDialog1)
	//await ppl.zombii.say(lorem)
	//await ppl.zombii.say("fuck it then.")
})

scripts.register("fireTrap", "cellEnter", async (cell) => {
	const {camera, player} = context
	player.lockInput()
	void camera.moveToCell(cell.x, cell.y, 500)
	void camera.zoomTo(camera.zoomCell, 500)
	await player.waitWalkEnd()
	await context.timer.wait(400)
	const fire = context.Item.create("fire-trap-fire")
	fire.setAnimation([
		["frame", 0, 200],
		["invoke", "glyph"],
		["delay", 700],
		["sequence", 1, 2, 100],
		[
			["sequence", 3, 4, 100],
			["loop"]
		]
	]).onInvoke.add(() => player.setTexture(context.Sprite.find("fire-trap-khajiit"), [
		["frame", 0, 400],
		["sequence", 1, 3, 200],
		["frame", 4, 400],
		["sequence", 4, 7, 200],
		["frame", 8, 600],
		[
			["sequence", 9, 10, 200],
			["loop", 4]
		],
		["invoke", () => (utils.reset(), true)]
	]))
	player.cell.addItem(fire)
})

scripts.register("spiderTrap", "cellEnter", async (cell) => {
	const {camera, player, map} = context
	player.lockInput()
	void camera.moveToCell(cell.x, cell.y, 500)
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
		animation.onEnd.add(() => {
			player.cell.addItem(context.Item.create("spider-web"))
			void context.timer.wait(200).then(utils.reset)
		})
		animation.onInvoke.add(() => (camera.shake(400, 1), false))
		spider.setAnimation(animation)
		player.cell.addItem(spider)
		return true
	})
	player.setTexture(context.Sprite.find("khajiit-spider"), animation)
})

scripts.register("roomEnter", "cellEnter", (cell, direction) => {
	const reverse = {
		up: "down",
		down: "up",
		left: "right",
		right: "left"
	} as const
	if (reverse[direction] == cell.data?.gateway) {
		const group = cell.getGroup()
		const bounds = cell.getGroupBounds(group)
		group.forEach(x => x.setVisible())
		context.player.lockInput()
		void Promise.all([
			context.camera.moveTo(
				(bounds[0] + (bounds[2] / 2)) * CONST.GRID_BASE,
				((bounds[1] + (bounds[3] / 2)) * CONST.GRID_BASE) + 6,
				500
			),
			context.camera.zoomTo(
				context.camera.zoomCell / Math.max(bounds[2], bounds[3]),
				500
			)
		]).then(() => context.player.unlockInput())
	}
})

scripts.register("roomExit", "cellExit", (cell, direction) => {
	if (direction == cell.data?.gateway) {
		const next = cell.getNeighbor(direction)
		const path = next.getEnterPath(direction)!
		const center = path[path.length - 1]
		context.player.lockInput()
		void Promise.all([
			context.camera.zoomTo(context.camera.zoomDefault, 500),
			context.camera.moveTo(
				(next.x * CONST.GRID_BASE) + center[0],
				(next.y * CONST.GRID_BASE) + center[1],
				500
			)
		]).then(() => {
			context.camera.lockOn(context.player)
			context.player.unlockInput()
		})
	}
})
