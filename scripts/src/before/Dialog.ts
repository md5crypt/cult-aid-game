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

	static setPrompt<T extends keyof DialogPromptName, K extends DialogPromptName[T][number]>(dialog: T, prompt: K | "default") {
		storage.dialog.prompts[dialog as DialogId] = prompt == "default" ? undefined : prompt
	}

	static onStart(dialog: keyof typeof DialogId, callback: Types.ScriptStorageMapping["dialogStart"]) {
		scripts.register("dialogStart", dialog, callback)
	}

	static onSelect(dialog: keyof typeof DialogId, callback: Types.ScriptStorageMapping["dialogSelect"]) {
		scripts.register("dialogSelect", dialog, callback)
	}

	static get hidden() {
		return context.ui.dialog.hidden
	}

	static set hidden(value: boolean) {
		context.ui.dialog.hidden = value
	}
}

type Test = typeof scripts["register"]
type Dupa = Test
