import { Listener } from "./Listener"

export class GameInput {
	private handlers: [string, EventListener][] = []

	public readonly onKeyUp: Listener<string> = new Listener()
	public readonly onKeyDown: Listener<string> = new Listener()
	public readonly keyboard: Record<string, boolean | undefined> = {}

	public register() {
		const keyDown = (event: KeyboardEvent) => {
			if (!this.keyboard[event.key]) {
				this.keyboard[event.key] = true
				this.onKeyDown.invoke(event.key)
			}
			event.preventDefault()
		}
		window.addEventListener("keydown", keyDown)
		this.handlers.push(["keydown", keyDown as EventListener])
		const keyUp = (event: KeyboardEvent) => {
			if (this.keyboard[event.key]) {
				this.keyboard[event.key] = false
				this.onKeyUp.invoke(event.key)
			}
			event.preventDefault()
		}
		window.addEventListener("keyup", keyUp)
		this.handlers.push(["keyup", keyUp as EventListener])
	}

	public unregister() {
		this.handlers.forEach(handler => window.removeEventListener(handler[0], handler[1]))
	}
}
