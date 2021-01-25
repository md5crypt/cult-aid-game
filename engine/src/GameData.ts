import { Animation } from "./Animation"

export namespace GameData {
	export interface PathData {
		readonly up?: readonly (readonly [number, number])[]
		readonly down?: readonly (readonly [number, number])[]
		readonly left?: readonly (readonly [number, number])[]
		readonly right?: readonly (readonly [number, number])[]
	}

	export interface SpriteData {
		readonly resource?: string
		readonly name?: string
		readonly pivot?: readonly [number, number]
		readonly scale?: number
		readonly delay?: number
		readonly plugs?: readonly string[]
		readonly autoReveal?: boolean
		readonly group?: string
		readonly animation?: Animation.Definition
		readonly zOffset?: number
		readonly onCreate?: string
		readonly onUpdate?: string
		readonly onEnterView?: string
		readonly onExitView?: string
	}

	export interface ScriptData {
		readonly type: "script"
		readonly cell: readonly [number, number]
		readonly onEnter?: string
		readonly onExit?: string
		readonly onUse?: string
		readonly onCreate?: string
	}

	export interface ItemData {
		readonly type: "item"
		readonly position: readonly [number, number]
		readonly sprite: string
		readonly name?: string
		readonly animation?: Animation.Definition
		readonly flipped?: boolean
		readonly zOffset?: number
		readonly onCreate?: string
		readonly onUpdate?: string
		readonly onEnterView?: string
		readonly onExitView?: string
		readonly enabled?: boolean
	}

	export interface PositionData {
		readonly type: "point"
		readonly name: string
		readonly position: readonly [number, number]
		readonly zOffset?: number
	}

	export interface ZoneData {
		readonly type: "zone"
		readonly resource: string
		readonly position: readonly [number, number]
		readonly enabled?: boolean
		readonly name?: string
		readonly onEnter?: string
		readonly onExit?: string
		readonly onUse?: string
	}

	export interface MapData {
		readonly tiles: readonly number[]
		readonly objects: readonly (ItemData | ScriptData | PositionData | ZoneData)[]
		readonly width: number
		readonly height: number
	}
}

export interface GameData {
	readonly sprites: readonly GameData.SpriteData[]
	readonly map: GameData.MapData
}
