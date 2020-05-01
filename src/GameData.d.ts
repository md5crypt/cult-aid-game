export namespace GameData {
	export interface Texture {
		frame: [number, number, number, number]
		offset: [number, number]
	}

	export interface Sprite {
		name: string
		layers: {
			fg?: Texture | Texture[]
			bg?: Texture | Texture[]
			char?: Texture | Texture[]
			item?: Texture | Texture[]
		}
		paths?: {
			top?: [number, number][]
			down?: [number, number][]
			left?: [number, number][]
			right?: [number, number][]
		}
		pivot?: [number, number]
		scale?: number
		delay?: number
	}

	export interface Map {
		fg: number[]
		bg: number[]
		width: number
		height: number
	}
}

export interface GameData {
	sprites: GameData.Sprite[]
	map: GameData.Map
}
