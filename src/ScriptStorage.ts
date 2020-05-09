import { GameMap } from "./GameMap"
import { Direction } from "./Path"
import { GameContext } from "./GameContext"

export type onMoveCallback = (context: GameContext, cell: GameMap.Cell, direction: Direction) => boolean
export type onEnterCallback = (context: GameContext, cell: GameMap.Cell, direction: Direction) => void
export type onExitCallback = (context: GameContext, cell: GameMap.Cell, direction: Direction) => void
export type onCenterCallback = (context: GameContext, cell: GameMap.Cell) => void
export type onUseCallback = (context: GameContext, cell: GameMap.Cell) => void


export class ScriptStorage {
	private map: Map<string, Function> = new Map()

	public register(event: "move", name: string, callback: onMoveCallback): void
	public register(event: "enter", name: string, callback: onEnterCallback): void
	public register(event: "exit", name: string, callback: onExitCallback): void
	public register(event: "center", name: string, callback: onExitCallback): void
	public register(event: "use", name: string, callback: onExitCallback): void
	public register(event: string, name: any, callback: any) {
		this.map.set(name + "." + event, callback)
	}

	public resolve(event: "move", name: string): onMoveCallback
	public resolve(event: "enter", name: string): onEnterCallback
	public resolve(event: "exit", name: string): onExitCallback
	public resolve(event: "center", name: string): onExitCallback
	public resolve(event: "use", name: string): onExitCallback
	public resolve(event: string, name: any): any {
		const callback = this.map.get(name + "." + event)
		if (!callback) {
			throw new Error(`could not find script ${name}.${event}`)
		}
		return callback
	}
}
