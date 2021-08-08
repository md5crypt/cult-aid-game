export class Dialog {
	static seen(dialog: keyof typeof DialogId, exclude: (keyof typeof FragmentId)[]) {
		const excludeSet = new Set(exclude)
		const options = context.speech.getDialogOptions(dialog) as (keyof typeof FragmentId)[]
		return options.filter(x => !excludeSet.has(x)).every(fragment => storage.dialog.seen[fragment])
	}

	static execute(dialog?: keyof typeof DialogId) {
		dialog && context.speech.pushDialog(dialog)
		return context.speech.start()
	}

	static push(dialog: keyof typeof DialogId) {
		context.speech.pushDialog(dialog)
	}

	static pop(amount?: number) {
		context.speech.popDialog(amount)
	}

	static exit() {
		context.speech.exitDialog()
	}

	static replace(dialog: keyof typeof DialogId) {
		context.speech.replaceDialog(dialog)
	}

	static restart(dialog: keyof typeof DialogId) {
		context.speech.restartDialog(dialog)
	}

	static setPrompt<T extends keyof DialogPromptNames, K extends DialogPromptNames[T][number]>(dialog: T, prompt: K | "default") {
		storage.dialog.prompts[dialog as DialogId] = prompt == "default" ? undefined : prompt
	}

	static onStart<T extends keyof typeof DialogId>(dialog: T | T[], callback: (dialog: T) => void | Promise<void>) {
		scripts.register("dialogStart", dialog, callback as Types.ScriptStorageMapping["dialogStart"])
	}

	static onSelect<T extends keyof DialogOptionNames>(dialog: T | T[], callback: (value: DialogOptionNames[T][number], dialog: T) => void | Promise<void> | Promise<boolean> | boolean) {
		scripts.register("dialogSelect", dialog, callback as Types.ScriptStorageMapping["dialogSelect"])
	}

	static get current() {
		return context.speech.currentDialog as DialogId | null
	}

	static get hidden() {
		return context.ui.dialog.hidden
	}

	static set hidden(value: boolean) {
		context.ui.dialog.hidden = value
	}
}

export default Dialog
