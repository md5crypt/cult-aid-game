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
import { BaseElement } from "./Layout/LayoutPIXI"
import { DialogUI } from "./UI/DialogUI"

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
		ui: PIXI.Container
	}
	/** @internal */
	layers: {
		bg: RectTileLayer
		mid: RectTileLayer
		fg: RectTileLayer
	}
	/** @internal */
	ui: {
		root: BaseElement
		dialog: DialogUI
	}
	camera: GameCamera
	player: Player
	Sprite: typeof Sprite
	Speech: typeof Speech
	Item: typeof Sprite.Item
	Path: typeof SimplePath
	Animation: typeof Animation
	scripts: ScriptStorage
	timer: ScriptTimer
}

export const gameContext = {} as GameContext
