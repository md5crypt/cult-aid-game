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
		layers: {
			fg?: Texture | Texture[]
			bg?: Texture | Texture[]
			char?: Texture | Texture[]
			item?: Texture | Texture[]
		}
		paths?: PathData
		pivot?: [number, number]
		scale?: number
		delay?: number
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
