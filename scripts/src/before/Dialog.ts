class Dialog {
	static seen(dialog: keyof typeof DialogId, exclude: (keyof typeof FragmentId)[]) {
		const excludeSet = new Set(exclude)
		const options = context.speech.getDialogOptions(dialog) as (keyof typeof FragmentId)[]
		return options.filter(x => !excludeSet.has(x)).every(fragment => storage.dialog.seen[fragment])
	}

	static execute(dialog: keyof typeof DialogId) {
		return context.speech.executeDialog(dialog)
	}

	static push(dialog: keyof typeof DialogId) {
		context.speech.dialog.push(dialog)
	}
}
