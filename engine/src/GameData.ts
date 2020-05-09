export namespace GameData {
	export interface Texture {
		frame: [number, number, number, number]
		offset: [number, number]
	}

	export interface PathData {
		up?: [number, number][]
		down?: [number, number][]
		left?: [number, number][]
		right?: [number, number][]
	}

	export interface SpriteData {
		name: string
		texture?: Texture | Texture[]
		fgTexture?: Texture | Texture[]
		paths?: PathData
		pivot?: [number, number]
		scale?: number
		delay?: number
		plugGroup?: string
		composite?: string[]
	}

	export interface MapData {
		bg: number[]
		width: number
		height: number
	}
}

export interface GameData {
	sprites: GameData.SpriteData[]
	map: GameData.MapData
}
