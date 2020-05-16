export class GameInput {
	private handlers: [string, EventListener][] = []

	public readonly keyboard: Record<string, boolean | undefined> = {}

	public register() {
		const keyDown = (event: KeyboardEvent) => {
			this.keyboard[event.key] = true
			event.preventDefault()
		}
		window.addEventListener("keydown", keyDown)
		this.handlers.push(["keydown", keyDown as EventListener])
		const keyUp = (event: KeyboardEvent) => {
			this.keyboard[event.key] = false
			event.preventDefault()
		}
		window.addEventListener("keyup", keyUp)
		this.handlers.push(["keyup", keyUp as EventListener])
	}

	public unregister() {
		this.handlers.forEach(handler => window.removeEventListener(handler[0], handler[1]))
	}
}
