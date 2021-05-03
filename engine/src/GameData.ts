import { Animation } from "./Animation"

export namespace GameData {

	export interface SpriteData {
		readonly resource?: string
		readonly pivot?: readonly [number, number]
		readonly scale?: number
		readonly delay?: number
		readonly plugs?: readonly string[]
		readonly autoReveal?: boolean
		readonly revealed?: boolean
		readonly group?: string
		readonly animation?: Animation.Definition
		readonly zOffset?: number
	}

	export interface ItemData {
		readonly type: "item"
		readonly position: readonly [number, number]
		readonly sprite: string
		readonly name?: string
		readonly animation?: Animation.Definition
		readonly flipped?: boolean
		readonly zOffset?: number
		readonly class?: string[]
		readonly enabled?: boolean
	}

	export interface PositionData {
		readonly type: "point"
		readonly name: string
		readonly position: readonly [number, number]
		readonly zOffset?: number
	}

	export interface PathData {
		readonly type: "path"
		readonly name: string
		readonly position: readonly [number, number]
		readonly points: readonly (readonly [number, number])[]
	}

	export interface ZoneData {
		readonly type: "zone"
		readonly resource?: string
		readonly dimensions: readonly [number, number]
		readonly position: readonly [number, number]
		readonly enabled?: boolean
		readonly name?: string
		readonly class?: string[]
	}

	export interface MapData {
		readonly name: string
		readonly tiles: readonly number[]
		readonly objects: readonly (ItemData | PositionData | PathData | ZoneData)[]
		readonly width: number
		readonly height: number
	}
}

export interface GameData {
	readonly sprites: readonly GameData.SpriteData[]
	readonly maps: readonly GameData.MapData[]
}
