import { GameMap } from "./GameMap"
import { Direction } from "./Path"
import { Sprite } from "./Sprite"
import { GameContext } from "./GameContext"

export type cellQueryCallback = (context: GameContext, cell: GameMap.Cell, direction: Direction) => boolean
export type cellDynamicCallback = (context: GameContext, cell: GameMap.Cell, direction: Direction) => void | Promise<void>
export type cellStaticCallback = (context: GameContext, cell: GameMap.Cell) => void | Promise<void>

export type itemCallback = (context: GameContext, item: Sprite.Item) => void | Promise<void>

interface Mapping {
	"cellMove": cellQueryCallback
	"cellEnter": cellDynamicCallback
	"cellExit": cellDynamicCallback
	"cellCenter": cellStaticCallback
	"cellUse": cellStaticCallback
	"itemUpdate": itemCallback
	"itemEnterView": itemCallback
	"itemExitView": itemCallback
	"itemInitiate": itemCallback
}

export class ScriptStorage {
	private map: Map<string, Function> = new Map()

	public register<T extends keyof Mapping>(name: string, event: T, callback: Mapping[T]) {
		this.map.set(name + "." + event, callback)
	}

	public resolve<T extends keyof Mapping>(name: string, event: T): Mapping[T] {
		const callback = this.map.get(name + "." + event) as Mapping[T]
		if (!callback) {
			throw new Error(`could not find script ${name}.${event}`)
		}
		return callback
	}

	public load(source: string) {
		(new Function(`"use strict";return function(storage){${source}}`))()(this)
	}
}
