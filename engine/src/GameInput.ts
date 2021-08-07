import { Listener } from "./Listener"

export type KeyboardKey = (
	"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" |
	"f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12" |
	"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" |
	"n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" |
	"*" | "(" | ")" |  "!" | "@" | "#" | "$" | "%" | "^" | "^" | "&" | "*" | "*" | "`" | "[" |
	"]" | "+" | "-" | "." | "/" | ";" | "=" | "," | "-" | "." | "_" | "+" | "/" | "~" | "'" |
	"backspace" | "tab" | "enter" | "shift" | "control" | "alt" | "capsLock" | "escape" | " " | "pageUp" | "pageDown" | "end" | "home" |
	"arrowLeft" | "arrowUp" | "arrowRight" | "arrowDown" | "left" | "up" | "right" | "down" | "insert" | "delete" | "meta" | "numLock" | "scrollLock"
)

export class GameInput {
	private handlers: [string, EventListener][] = []

	public readonly onKeyUp: Listener<[KeyboardKey]> = new Listener()
	public readonly onKeyDown: Listener<[KeyboardKey]> = new Listener()
	public readonly keyboard: Partial<Record<KeyboardKey, boolean>> = {}

	public register() {
		const keyDown = (event: KeyboardEvent) => {
			const key = event.key[0].toLowerCase() + event.key.slice(1) as KeyboardKey
			if (!this.keyboard[key]) {
				this.keyboard[key] = true
				this.onKeyDown.invoke(key)
			}
			if (key != "f11" && key != "f5") {
				event.preventDefault()
			}
		}
		window.addEventListener("keydown", keyDown)
		this.handlers.push(["keydown", keyDown as EventListener])
		const keyUp = (event: KeyboardEvent) => {
			const key = event.key[0].toLowerCase() + event.key.slice(1) as KeyboardKey
			if (this.keyboard[key]) {
				this.keyboard[key] = false
				this.onKeyUp.invoke(key)
			}
			if (key != "f11" && key != "f5") {
				event.preventDefault()
			}
		}
		window.addEventListener("keyup", keyUp)
		this.handlers.push(["keyup", keyUp as EventListener])
	}

	public unregister() {
		this.handlers.forEach(handler => window.removeEventListener(handler[0], handler[1]))
	}
}

export default GameInput
