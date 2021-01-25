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
import { Speech } from "./Speech"
import { NavMap } from "./NavMap"
import { UI } from "./UI/UI"

import { Container } from "@pixi/display"

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
		tile: Container
		ui: Container
	}
	/** @internal */
	layers: {
		bg: RectTileLayer
		mid: RectTileLayer
		fg: RectTileLayer
	}
	ui: UI
	camera: GameCamera
	player: Player
	speech: Speech
	navMap: NavMap
	Sprite: typeof Sprite
	Item: typeof Sprite.Item
	Path: typeof SimplePath
	Animation: typeof Animation
	scripts: ScriptStorage
	storage: Record<string, any>
	timer: ScriptTimer
}

export const gameContext = {} as GameContext
