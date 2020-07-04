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
		readonly paths?: PathData
		readonly pivot?: readonly [number, number]
		readonly scale?: number
		readonly delay?: number
		readonly plugs?: readonly string[]
		readonly group?: string
		readonly gateway?: "up" | "down" | "left" | "right"
		readonly composite?: readonly string[]
		readonly animation?: Animation.Definition
		readonly zIndex?: number
		readonly onCreate?: string
		readonly onUpdate?: string
		readonly onEnterView?: string
		readonly onExitView?: string
	}

	export interface ScriptData {
		readonly cell: readonly [number, number]
		readonly name?: string
		readonly onEnter?: string
		readonly onExit?: string
		readonly onMove?: string
		readonly onUse?: string
		readonly onCenter?: string
		readonly onCreate?: string
	}

	export interface ItemData {
		readonly cell: readonly [number, number]
		readonly sprite: string
		readonly name?: string
		readonly animation?: Animation.Definition
		readonly zIndex?: number
		readonly offset?: readonly [number, number]
		readonly onCreate?: string
		readonly onUpdate?: string
		readonly onEnterView?: string
		readonly onExitView?: string
	}

	export interface MapData {
		readonly tiles: readonly number[]
		readonly objects: readonly (ItemData | ScriptData)[]
		readonly width: number
		readonly height: number
	}
}

export interface GameData {
	readonly sprites: readonly GameData.SpriteData[]
	readonly map: GameData.MapData
}
