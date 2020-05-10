import { GameMap } from "./GameMap"
import { GameData } from "./GameData"
import { GameInput } from "./GameInput"
import { SimplePath } from "./Path"
import { Sprite } from "./Sprite"
import { ScriptStorage } from "./ScriptStorage"
import { RectTileLayer } from "./RectTile/RectTileLayer"

export interface GameContext {
	time: number
	map: GameMap
	data: GameData
	input: GameInput
	layers: {
		bg: RectTileLayer
		mid: RectTileLayer
		fg: RectTileLayer
	}
	camera: [number, number]
	player: Sprite.Character
	class: {
		Sprite: typeof Sprite
		GameMap: typeof GameMap
		SimplePath: typeof SimplePath
	}
	scripts: ScriptStorage
}

export const gameContext = {
	class: {
		Sprite,
		GameMap,
		SimplePath
	}
} as GameContext
