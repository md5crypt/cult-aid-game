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
	hidden?: boolean
}

interface SpeechDialog {
	options: SpeechDialogOption[]
	prompts: Record<string, string>
}

interface SpeechData {
	characters: Record<string, SpeechCharacter>
	fragments: Record<string, SpeechFragment>
	dialogs: Record<string, SpeechDialog>
}

export class Speech {
	public readonly data: SpeechData
	private _dialog: Dialog | null
	private audio?: any

	public constructor(data: SpeechData, audio?: any) {
		this.data = data
		this._dialog = null
		this.audio = audio
		if (!gameContext.storage.dialog) {
			gameContext.storage.dialog = {hidden: {}, seen: {}}
		}
	}

	public get dialog() {
		if (!this._dialog) {
			throw new Error("dialog is not active")
		}
		return this._dialog
	}

	public getDialogOptions(id: string) {
		return this.data.dialogs[id].options.map(x => id + ".option." + x.id)
	}

	public async executeDialog(id: string, noClaim?: boolean): Promise<void>
	public async executeDialog(id: string, intro?: string): Promise<void>
	public async executeDialog(id: string, arg?: string | boolean): Promise<void> {
		if (this._dialog != null) {
			throw new Error("a dialog is already running!")
		}
		if (typeof arg == "string") {
			await this.executeFragment(arg, true)
		}
		this._dialog = new Dialog(id)
		return this._dialog.start(!!arg).then(() => {
			this._dialog = null
		})
	}

	public async executeFragment(id: string, noRelease = false): Promise<void> {
		const fragment = this.data.fragments[id]
		if (await gameContext.scripts.resolve("fragmentBefore", id)?.(id)) {
			return
		}
		gameContext.ui.dialog.claim()
		loop: for (let i = 0; i < fragment.length; i++) {
			const item = fragment[i]
			if ("function" in item) {
				switch (item.function) {
					case "seen":
						gameContext.storage.dialog.seen[item.argument || id] = true
						break
					case "hide":
						gameContext.storage.dialog.hidden[item.argument || id] = true
						break
					case "show":
						gameContext.storage.dialog.hidden[item.argument || id] = false
						break
					case "show-unseen":
						if (!gameContext.storage.dialog.seen[item.argument || id]) {
							gameContext.storage.dialog.hidden[item.argument || id] = false
						}
						break
					case "exit":
						this._dialog!.exit()
						break
					case "pop":
						this._dialog!.pop(item.argument ? parseInt(item.argument, 10) : 1)
						break
					case "call":
						await this.executeFragment(item.argument!)
						break
					case "invoke":
						if (await gameContext.scripts.resolveOrThrow("fragmentInvoke", id)(item.argument, id)) {
							break loop
						}
						break
					case "push":
					case "replace":
					case "restart":
						this._dialog![item.function](item.argument!)
						break
					default:
						throw new Error(`invalid dialog operation: ${item.function}`)
				}
			} else {
				const character = this.data.characters[item.character]
				const soundId = id + "." + i
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
		}
		if (!noRelease) {
			await gameContext.ui.dialog.release()
		}
		await gameContext.scripts.resolve("fragmentAfter", id)?.(id)
	}
}

export class Dialog {
	private stack: {dialog: string, lastSelection?: string}[]

	public constructor(dialog: string) {
		this.stack = [{dialog}]
	}

	public get id() {
		return this.stack[this.stack.length - 1].dialog
	}

	/** @internal */
	public async start(noClaim = false) {
		if (!noClaim) {
			gameContext.ui.dialog.claim()
		}
		const storage = gameContext.storage.dialog as {hidden: Record<string,boolean>, seen: Record<string,boolean>}

		while (this.stack.length > 0) {
			const element = this.stack[this.stack.length - 1]
			await gameContext.scripts.resolve("dialogStart", element.dialog)?.(element.dialog)
			if (this.stack.length == 0) {
				// dialogStart script could have ended the dialog
				break
			}
			const data = gameContext.speech.data
			const dialog = data.dialogs[element.dialog]
			const prompt = data.fragments[`${element.dialog}.prompt.default`][0] as SpeechFragmentElement
			const character = data.characters[prompt.character]
			const options = dialog.options.map(option => ({
				id: option.id,
				text: option.text,
				seen: storage.seen[`${element.dialog}.option.${option.id}`],
				hidden: storage.hidden[`${element.dialog}.option.${option.id}`] ?? option.hidden
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

			const filteredOptions = options.filter(option => !option.hidden)
			const selectedId = filteredOptions[await gameContext.ui.dialog.renderOptions({
				options: filteredOptions,
				prompt: character.name ? `[color=${character.color}]${character.name}:[/color] ${prompt.text}` : prompt.text,
				avatar: character.avatars[prompt.avatar || "default"],
				activeOption
			})].id

			element.lastSelection = selectedId
			if (!(await gameContext.scripts.resolve("dialogSelect", element.dialog)?.(selectedId, element.dialog))) {
				await gameContext.speech.executeFragment(`${element.dialog}.option.${selectedId}`)
			}
		}
		await gameContext.ui.dialog.release()
	}

	public restart(dialog: string) {
		this.stack = [{dialog}]
	}

	public pop(amount = 1) {
		for (let i = 0; i < amount; i++) {
			this.stack.pop()
		}
	}

	public push(dialog: string) {
		this.stack.push({dialog})
	}

	public unshift(dialog: string) {
		this.stack.unshift({dialog})
	}

	public replace(dialog: string) {
		if (this.stack.length == 0) {
			throw new Error("can not replace dialog, stack empty")
		}
		this.stack[this.stack.length - 1] = {dialog}
	}

	public exit() {
		this.stack = []
	}
}
