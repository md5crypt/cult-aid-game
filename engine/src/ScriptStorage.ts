import { GameMap } from "./GameMap"
import { Direction } from "./Path"
import { Sprite } from "./Sprite"
import { gameContext } from "./GameContext"
import { Listener } from "./Listener"

export interface Mapping {
	"mapLoad": ScriptStorage.mapCallback
	"zoneEnter": ScriptStorage.zoneCallback
	"zoneExit": ScriptStorage.zoneCallback
	"zoneUse": ScriptStorage.zoneCallback
	"itemUpdate": ScriptStorage.itemCallback
	"itemEnterView": ScriptStorage.itemCallback
	"itemExitView": ScriptStorage.itemCallback
	"fragmentBefore": ScriptStorage.fragmentCallback
	"fragmentAfter": ScriptStorage.fragmentCallback
	"fragmentInvoke": ScriptStorage.fragmentInvokeCallback
	"dialogStart": ScriptStorage.dialogStartCallback
	"dialogSelect": ScriptStorage.dialogSelectCallback
}

export class ScriptStorage {
	private map: Map<string, Function> = new Map()

	public register<T extends keyof Mapping>(event: T, name: string, callback: Mapping[T]) {
		this.map.set(name + "." + event, callback)
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
		(new Function(`"use strict";return function(context, scripts, storage){${source}}`))()(gameContext, this, gameContext.storage)
	}
}

export namespace ScriptStorage {
	export type mapCallback = (mapId: string) => void | Promise<void>
	export type zoneCallback = (zone: GameMap.Zone) => void | Promise<void>
	export type cellDynamicCallback = (cell: GameMap.Cell, direction: Direction) => void | Promise<void>
	export type cellStaticCallback = (cell: GameMap.Cell) => void | Promise<void>
	export type itemCallback = (item: Sprite.Item) => void | Promise<void>
	export type dialogStartCallback = (dialogId: string) => void | Promise<void>
	export type dialogSelectCallback = (optionId: string, dialogId: string) => void | Promise<void> | Promise<boolean> | boolean
	export type fragmentCallback = (fragmentId: string) => void | boolean | Promise<void | boolean>
	export type fragmentInvokeCallback = (userData: string | undefined, fragmentId: string) => void | boolean | Promise<void | boolean>
}
