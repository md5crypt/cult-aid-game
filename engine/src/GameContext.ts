import { GameMap } from "./GameMap"
import { GameData } from "./GameData"
import { GameInput } from "./GameInput"
import { GameCamera } from "./GameCamera"
import { SimplePath } from "./Path"
import { Sprite } from "./Sprite"
import { ScriptStorage } from "./ScriptStorage"
import { RectTileLayer } from "./RectTile/RectTileLayer"
import { ScriptTimer } from "./ScriptTimer"
import { Animation } from "./Animation"
import { Player } from "./Player"
import { TextureStorage } from "./Resources"

export interface GameContext {
	time: number
	map: GameMap
	data: GameData
	input: GameInput
	/** @internal */
	textures: {
		ui: TextureStorage
		tiles: TextureStorage
	}
	/** @internal */
	stage: {
		tile: PIXI.Container
		UI: PIXI.Container
	}
	/** @internal */
	layers: {
		bg: RectTileLayer
		mid: RectTileLayer
		fg: RectTileLayer
	}
	camera: GameCamera
	player: Player
	Sprite: typeof Sprite
	Item: typeof Sprite.Item
	Character: typeof Sprite.Character
	Path: typeof SimplePath
	Animation: typeof Animation
	scripts: ScriptStorage
	timer: ScriptTimer
}

export const gameContext = {} as GameContext
