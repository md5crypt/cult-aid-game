Dialog.onStart("cards-main", () => Fragment.pushIfUnseen("cards-intro"))

Fragment.onInvoke(["cards-main.option.take-mead", "cards-take-mead.option.take"], Inventory.equipHandler("mead"))

Fragment.onAfter(
	[
		"cards-game-select.option.nord",
		"cards-game-select.option.breton",
		"cards-game-select.option.breton-2"
	],
	fragment => {
		const isNord = (fragment == "cards-game-select.option.nord")
		context.camera.enabled = false
		context.ui.cardGame.enabled = true
		context.ui.cardGame.interactive = false
		void context.ui.dialog.ensureClosed().then(() => context.ui.cardGame.interactive = true)
		void context.ui.cardGame.startGame(isNord ? 3 : 9).then(result => {
			if (result) {
				if (isNord) {
					Fragment.execute(Fragment.seen("cards-nord-win") ? "cards-nord-win-again" : "cards-nord-win")
				} else {
					Fragment.execute(Fragment.seen("cards-breton-win") ? "cards-breton-win-again" : "cards-breton-win")
				}
			} else {
				Fragment.execute(isNord ? "cards-nord-lost" : "cards-breton-lost")
			}
		})
	}
)

Fragment.onAfter(
	[
		"cards-nord-win",
		"cards-nord-win-again",
		"cards-nord-lost",
		"cards-breton-win",
		"cards-breton-win-again",
		"cards-breton-lost"
	],
	() => {
		context.camera.enabled = true
		context.ui.cardGame.enabled = false
	}
)

Fragment.onInvoke("cards-finale", value => {
	// todo
})
