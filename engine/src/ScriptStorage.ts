import type { GameMapCell, GameMapZone } from "./GameMap"
import { Direction } from "./Path"
import { ItemSprite } from "./Sprite"
import { gameContext } from "./GameContext"
import { Listener } from "./Listener"

export type mapCallback = (mapId: string) => void | Promise<void>
export type zoneCallback = (zone: GameMapZone) => void | Promise<void>
export type cellDynamicCallback = (cell: GameMapCell, direction: Direction) => void | Promise<void>
export type cellStaticCallback = (cell: GameMapCell) => void | Promise<void>
export type itemCallback = (item: ItemSprite) => void | Promise<void>
export type dialogStartCallback = (dialogId: string) => void | Promise<void>
export type dialogSelectCallback = (optionId: string, dialogId: string) => void | Promise<void> | Promise<boolean> | boolean
export type fragmentCallback = (fragmentId: string) => void | Promise<void>
export type fragmentInvokeCallback = (userData: string | undefined, fragmentId: string) => void | Promise<void>

export interface Mapping {
	"mapLoad": mapCallback
	"zoneEnter": zoneCallback
	"zoneExit": zoneCallback
	"zoneUse": zoneCallback
	"itemUpdate": itemCallback
	"itemEnterView": itemCallback
	"itemExitView": itemCallback
	"fragmentBefore": fragmentCallback
	"fragmentAfter": fragmentCallback
	"fragmentInvoke": fragmentInvokeCallback
	"dialogStart": dialogStartCallback
	"dialogSelect": dialogSelectCallback
}

export class ScriptStorage {
	private map: Map<string, Function> = new Map()

	public register<T extends keyof Mapping>(event: T, name: string | string[], callback: Mapping[T]) {
		if (typeof name == "string") {
			this.map.set(name + "." + event, callback)
		} else {
			for (let i = 0; i < name.length; i += 1) {
				this.map.set(name[i] + "." + event, callback)
			}
		}
	}

	public resolveAll<T extends keyof Mapping>(event: T, listener: Listener<any>, name?: string, classList?: string[]) {
		if (name) {
			const callback = this.resolve(event, name)
			if (callback) {
				listener.add(callback)
			}
		}
		if (classList) {
			for (const className of classList) {
				const callback = this.resolve(event, className)
				if (callback) {
					listener.add(callback)
				}
			}
		}
	}

	public resolve<T extends keyof Mapping>(event: T, name: string) {
		return this.map.get(name + "." + event) as Mapping[T] | undefined
	}

	public resolveOrThrow<T extends keyof Mapping>(event: T, name: string): Mapping[T] {
		const callback = this.resolve(event, name)
		if (!callback) {
			throw new Error(`could not find script ${name}.${event}`)
		}
		return callback
	}

	/** @internal */
	public load(source: string) {
		(new Function(`"use strict";return function(context, scripts, storage){${source}\n}`))()(gameContext, this, gameContext.storage)
	}
}

export default ScriptStorage
