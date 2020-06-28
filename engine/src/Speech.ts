import { gameContext } from "./GameContext"

export namespace Speech {

	type AvatarMap = {default: string, [key: string]: string}

	interface CharacterConfig<T, K> {
		avatars: K
		name: string | (() => string)
		color?: string | (() => string)
		data?: T
	}

	interface SayParams<T = any, K extends AvatarMap = any> {
		operation?: "say"
		character: Character<T, K>
		avatar?: keyof K
		text: string
	}

	type DialogOperation = (
		{operation: "exit"} |
		{operation: "push" | "restart" | "replace", dialog: DialogConfig} |
		{operation: "pop", amount?: number}
	)

	type MaybePromise<T = void> = T | Promise<T>
	type SayFunction = () => MaybePromise
	type DialogFunction = (dialog: Dialog) => MaybePromise

	interface DialogOption {
		text: string | (() => string)
		action: DialogFunction | (SayParams | DialogOperation | DialogFunction)[]
		enabled?: () => boolean
	}

	interface DialogConfig<T = any, K extends AvatarMap = any> {
		character: Character<T, K>
		avatar?: keyof K | ((character: Character<T, K>) => (keyof K | undefined))
		prompt?: string | ((character: Character<T, K>) => (string | undefined))
		options: DialogOption[]
	}

	export async function execute(batch: (SayParams | SayFunction)[]): Promise<void>
	export async function execute(batch: (SayParams | DialogOperation | DialogFunction)[], dialog: Dialog): Promise<void>
	export async function execute(batch: (SayParams | DialogOperation | DialogFunction | SayFunction)[], dialog?: Dialog) {
		gameContext.ui.dialog.claim()
		for (const item of batch) {
			if (typeof item == "function") {
				const result = dialog ? item(dialog) : (item as SayFunction)()
				if (result instanceof Promise) {
					await result
				}
			} else if (item.operation) {
				switch (item.operation) {
					case "exit":
						dialog!.exit()
						break
					case "pop":
						dialog!.pop(item.amount)
						break
					case "push":
					case "replace":
					case "restart":
						dialog![item.operation](item.dialog)
						break
					default:
						throw new Error(`invalid dialog operation: ${item.operation}`)
				}
			} else {
				await new Promise(resolve => gameContext.ui.dialog.renderSpeech(
					`[color=${item.character.color}]${item.character.name}:[/color] ${item.text}`,
					item.character.getAvatar(item.avatar || "default"),
					() => resolve()
				))
			}
		}
		gameContext.ui.dialog.release()
	}

	export function start<T, K extends AvatarMap>(dialog: DialogConfig<T, K>) {
		return Dialog.start(dialog)
	}

	export function exit(): DialogOperation {
		return {operation: "exit"}
	}

	export function pop(amount?: number): DialogOperation {
		return {operation: "pop", amount}
	}

	export function push(config: DialogConfig): DialogOperation {
		return {operation: "push", dialog: config}
	}

	export function restart(config: DialogConfig): DialogOperation {
		return {operation: "restart", dialog: config}
	}

	export function replace(config: DialogConfig): DialogOperation {
		return {operation: "replace", dialog: config}
	}

	class Dialog {
		private stack: DialogConfig[]
		private resolve: (() => void) | null

		private constructor() {
			this.stack = []
			this.resolve = null
		}

		public static start<T, K extends AvatarMap>(dialog: DialogConfig<T, K>): Promise<void> {
			const object = new Dialog()
			object.stack = [dialog]
			gameContext.ui.dialog.claim()
			return new Promise(resolve => {
				object.resolve = resolve
				object.continue()
			})
		}

		private continue() {
			if (this.stack.length == 0) {
				gameContext.ui.dialog.release()
				this.resolve!()
				return
			}
			const dialog = this.stack[this.stack.length - 1]
			const prompt = typeof dialog.prompt == "function" ? dialog.prompt(dialog.character) : dialog.prompt
			const avatar = typeof dialog.avatar == "function" ? dialog.avatar(dialog.character) : (dialog.avatar || "default")
			const options = dialog.options.filter(option => !option.enabled || option.enabled())
			void new Promise<number>(resolve => gameContext.ui.dialog.renderOptions(
				options.map(option => typeof option.text == "function" ? option.text() : option.text),
				prompt && `[color=${dialog.character.color}]${dialog.character.name}:[/color] ${prompt}`,
				avatar && dialog.character.getAvatar(avatar),
				resolve
			)).then(async index => {
				const action = options[index].action
				if (Array.isArray(action)) {
					await Speech.execute(action, this)
				} else {
					await action(this)
				}
				this.continue()
			})
		}

		public restart<T, K extends AvatarMap>(dialog: DialogConfig<T, K>) {
			this.stack = [dialog]
		}

		public pop(amount = 1) {
			for (let i = 0; i < amount; i++) {
				this.stack.pop()
			}
		}

		public push<T, K extends AvatarMap>(dialog: DialogConfig<T, K>) {
			this.stack.push(dialog)
		}

		public replace<T, K extends AvatarMap>(dialog: DialogConfig<T, K>) {
			if (this.stack.length == 0) {
				throw new Error("can not replace dialog, stack empty")
			}
			this.stack[this.stack.length - 1] = dialog
		}

		public exit() {
			this.stack = []
		}
	}

	export class Character<T, K extends AvatarMap> {
		private config: CharacterConfig<T, K>

		public constructor(config: CharacterConfig<T, K>) {
			this.config = config
		}

		public get data() {
			return this.config.data!
		}

		public get color() {
			return typeof this.config.color == "function" ? this.config.color() : this.config.color
		}

		public get name() {
			return typeof this.config.name == "function" ? this.config.name() : this.config.name
		}

		public getAvatar(name: keyof K) {
			return this.config.avatars[name]
		}

		public say(text: string, execute?: false): SayParams<T, K>
		public say(text: string, execute: true): Promise<void>
		public say(avatar: keyof K, text: string, execute?: false): SayParams<T, K>
		public say(avatar: keyof K, text: string, execute: true): Promise<void>
		public say(arg1: string, arg2?: string | boolean, arg3?: boolean): SayParams<T, K> | Promise<void> {
			let execute = false
			let result: SayParams<T, K>
			if (typeof arg2 == "string") {
				execute = Boolean(arg3)
				result = {text: arg2, avatar: arg1, character: this}
			} else {
				execute = Boolean(arg2)
				result = {text: arg1, character: this}
			}
			return execute ? Speech.execute([result]) : result
		}

		public ask(params: Omit<DialogConfig<T, K>, "character">): DialogConfig<T, K> {
			return {...params, character: this}
		}
	}
}
