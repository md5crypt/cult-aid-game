import { gameContext } from "./GameContext"

interface SpeechCharacter {
	name: string
	color: string
	avatars: Record<string, string>
}

interface SpeechFragmentElement {
	character: string
	avatar?: string
	text: string
}

interface SpeechFragmentFunction {
	function: string
	argument?: string
}

type SpeechFragment = (SpeechFragmentElement | SpeechFragmentFunction)[]

interface SpeechDialogOption {
	id: string
	text: string
	import?: string
	hidden?: boolean
}

interface SpeechDialog {
	options: SpeechDialogOption[]
	imports?: string[]
}

interface SpeechData {
	characters: Record<string, SpeechCharacter>
	fragments: Record<string, SpeechFragment>
	dialogs: Record<string, SpeechDialog>
}

interface SpeechStorage {
	hidden: Record<string, boolean | undefined>
	seen: Record<string, boolean | undefined>
	prompts: Record<string, string | undefined>
}

interface DialogStackItem {
	id: string
	lastSelection?: string
}

interface FragmentStackItem {
	id: string
	index?: number
}

export class Speech {
	private data: SpeechData
	private dialogStack: DialogStackItem[]
	private fragmentStack: FragmentStackItem[]
	private audio?: any
	private dirty: boolean
	private _running: boolean

	public constructor(data: SpeechData, audio?: any) {
		this.data = data
		this.audio = audio
		this.dialogStack = []
		this.fragmentStack = []
		this.dirty = false
		this._running = false
		if (!gameContext.storage.dialog) {
			gameContext.storage.dialog = {hidden: {}, seen: {}}
		}
	}

	private async executeDialog(element: DialogStackItem): Promise<void> {
		const storage = gameContext.storage.dialog as SpeechStorage
		const dialog = this.data.dialogs[element.id]

		if (dialog.imports) {
			for (const importId of dialog.imports) {
				await gameContext.scripts.resolve("dialogStart", importId)?.(importId)
				if (this.dirty) {
					return
				}
			}
		}

		await gameContext.scripts.resolve("dialogStart", element.id)?.(element.id)
		if (this.dirty) {
			return
		}

		const options = dialog.options.map(option => ({
			dialog: option.import || element.id,
			id: option.id,
			text: option.text,
			seen: storage.seen[`${option.import || element.id}.option.${option.id}`],
			hidden: storage.hidden[`${option.import || element.id}.option.${option.id}`] ?? option.hidden
		}))

		let activeOption = 0
		if (element.lastSelection) {
			for (const option of options) {
				activeOption += option.hidden ? 0 : 1
				if (option.id == element.lastSelection) {
					activeOption = Math.max(activeOption - 1, 0)
					break
				}
			}
		}

		let prompt
		let avatar

		const promptFragment = this.data.fragments[`${element.id}.prompt.${storage.prompts[element.id] ?? "default"}`]
		if (promptFragment) {
			const speechFragment = promptFragment[0] as SpeechFragmentElement
			const character = this.data.characters[speechFragment.character]
			prompt = character.name ? `[color=${character.color}]${character.name}:[/color] ${speechFragment.text}` : speechFragment.text
			avatar = character.avatars[speechFragment.avatar || "default"]
		}

		const filteredOptions = options.filter(option => !option.hidden)
		const selected = filteredOptions[await gameContext.ui.dialog.renderOptions({
			options: filteredOptions,
			prompt,
			avatar,
			activeOption
		})]

		element.lastSelection = selected.id
		if (!(await gameContext.scripts.resolve("dialogSelect", element.id)?.(selected.id, selected.dialog))) {
			this.pushFragment(`${selected.dialog}.option.${selected.id}`)
		}
	}

	private async executeFragment(element: FragmentStackItem): Promise<void> {
		const storage = gameContext.storage.dialog as SpeechStorage
		const fragment = this.data.fragments[element.id]
		if (element.index === undefined) {
			element.index = 0
			await gameContext.scripts.resolve("fragmentBefore", element.id)?.(element.id)
			if (this.dirty) {
				return
			}
		}
		if (element.index >= fragment.length) {
			this.popFragment()
			await gameContext.scripts.resolve("fragmentAfter", element.id)?.(element.id)
			return
		}
		const item = fragment[element.index]
		if ("function" in item) {
			switch (item.function) {
				case "seen":
					storage.seen[item.argument || element.id] = true
					break
				case "hide":
					storage.hidden[item.argument || element.id] = true
					break
				case "show":
					storage.hidden[item.argument || element.id] = false
					break
				case "show-unseen":
					if (!storage.seen[item.argument || element.id]) {
						storage.hidden[item.argument || element.id] = false
					}
					break
				case "exit":
					this.exitDialog()
					break
				case "prompt": {
					const data = item.argument!.split(".prompt.")
					storage.prompts[data[0]] = data[1]
					break
				}
				case "pop":
					this.popDialog(item.argument ? parseInt(item.argument, 10) : 1)
					break
				case "call":
					this.pushFragment(item.argument!)
					break
				case "invoke":
					await gameContext.scripts.resolveOrThrow("fragmentInvoke", element.id)(item.argument, element.id)
					break
				case "push":
					this.pushDialog(item.argument!)
					break
				case "replace":
					this.replaceDialog(item.argument!)
					break
				case "restart":
					this.restartDialog(item.argument!)
					break
				default:
					throw new Error(`invalid dialog operation: ${item.function}`)
			}
		} else {
			const character = this.data.characters[item.character]
			const soundId = element.id + "." + element.index
			if (this.audio && soundId in this.audio.sprites) {
				void this.audio.play(soundId)
			}
			await gameContext.ui.dialog.renderSpeech(
				character.name ? `[color=${character.color}]${character.name}:[/color] ${item.text}` : item.text,
				character.avatars[item.avatar || "default"]
			)
			if (this.audio && soundId in this.audio.sprites) {
				this.audio.stop()
			}
		}
		element.index += 1
	}

	public get currentDialog() {
		return this.dialogStack.length ? this.dialogStack[this.dialogStack.length - 1].id : null
	}

	public get currentFragment() {
		return this.fragmentStack.length ? this.fragmentStack[this.fragmentStack.length - 1].id : null
	}

	public getDialogOptions(id: string) {
		return this.data.dialogs[id].options.map(x => (x.import || id) + ".option." + x.id)
	}

	public get running() {
		return this._running
	}

	public async start() {
		if (this._running) {
			throw new Error("speech already running")
		}
		this._running = true
		gameContext.ui.dialog.claim()
		while (true) {
			this.dirty = false
			if (this.fragmentStack.length > 0) {
				await this.executeFragment(this.fragmentStack[this.fragmentStack.length - 1])
				continue
			}
			if (this.dialogStack.length > 0) {
				await this.executeDialog(this.dialogStack[this.dialogStack.length - 1])
				continue
			}
			break
		}
		await gameContext.ui.dialog.release()
		this._running = false
	}

	public restartDialog(dialog: string) {
		this.dirty = true
		this.dialogStack = [{id: dialog}]
	}

	public popDialog(amount = 1) {
		this.dirty = true
		for (let i = 0; i < amount; i++) {
			this.dialogStack.pop()
		}
	}

	public pushDialog(dialog: string) {
		this.dirty = true
		this.dialogStack.push({id: dialog})
	}

	public replaceDialog(dialog: string) {
		this.dirty = true
		if (this.dialogStack.length == 0) {
			throw new Error("can not replace dialog, stack empty")
		}
		this.dialogStack[this.dialogStack.length - 1] = {id: dialog}
	}

	public exitDialog() {
		this.dirty = true
		this.dialogStack = []
	}

	public popFragment(amount = 1) {
		this.dirty = true
		for (let i = 0; i < amount; i++) {
			this.fragmentStack.pop()
		}
	}

	public pushFragment(fragment: string) {
		this.dirty = true
		this.fragmentStack.push({id: fragment})
	}
}

export default Speech
