import { gameContext } from "./GameContext"

interface CharacterConfig<T, K> {
	avatars: K
	name: string | (() => string)
	color?: string | (() => string)
	data?: T
	defaultSide?: "left" | "right"
}

interface SayParams<K> {
	side?: "left" | "right"
	avatar?: keyof K
	text: string
}

export class Character<T, K extends {default: string, [key: string]: string}> {
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

	public say(params: SayParams<K>): Promise<void>
	public say(text: string): Promise<void>
	public say(arg: string | SayParams<K>): Promise<void> {
		if (typeof arg == "string") {
			return this.say({text: arg})
		}
		const inputStatus = gameContext.player.inputEnabled
		gameContext.player.inputEnabled = false
		return new Promise(resolve => gameContext.ui.dialog.renderSpeech(
			`[color=${this.color}]${this.name}:[/color] ${arg.text}`,
			{ [arg.side || this.config.defaultSide || "left"]: this.config.avatars[arg.avatar || "default"] },
			() => {
				gameContext.player.inputEnabled = inputStatus
				gameContext.ui.dialog.clear()
				resolve()
			})
		)
	}
}
