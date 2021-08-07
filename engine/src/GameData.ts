import type { AnimationDefinition } from "./Animation"

export interface GameDataSprite {
	readonly resource?: string
	readonly pivot?: readonly [number, number]
	readonly scale?: number
	readonly delay?: number
	readonly plugs?: readonly string[]
	readonly autoReveal?: boolean
	readonly revealed?: boolean
	readonly group?: string
	readonly animation?: AnimationDefinition
	readonly zOffset?: number
}

export interface GameDataItem {
	readonly type: "item"
	readonly position: readonly [number, number]
	readonly sprite: string
	readonly name?: string
	readonly animation?: AnimationDefinition
	readonly flipped?: boolean
	readonly zOffset?: number
	readonly class?: string[]
	readonly enabled?: boolean
}

export interface GameDataPosition {
	readonly type: "point"
	readonly name: string
	readonly position: readonly [number, number]
	readonly zOffset?: number
}

export interface GameDataPath {
	readonly type: "path"
	readonly name: string
	readonly position: readonly [number, number]
	readonly points: readonly (readonly [number, number])[]
}

export interface GameDataZone {
	readonly type: "zone"
	readonly resource?: string
	readonly dimensions: readonly [number, number]
	readonly position: readonly [number, number]
	readonly enabled?: boolean
	readonly name?: string
	readonly class?: string[]
}

export interface GameDataMap {
	readonly name: string
	readonly tiles: readonly number[]
	readonly objects: readonly (GameDataItem | GameDataPosition | GameDataPath | GameDataZone)[]
	readonly width: number
	readonly height: number
}

export interface GameData {
	readonly sprites: readonly GameDataSprite[]
	readonly maps: readonly GameDataMap[]
}

export default GameData
