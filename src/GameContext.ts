import { GameMap } from "./GameMap"
import { GameData } from "./GameData"
import { GameInput } from "./GameInput"
import { RectTileLayer } from "./RectTile/RectTileLayer"

export class GameContext {
	public static time: number
	public static map: GameMap
	public static data: GameData
	public static input: GameInput
	public static layers: {
		bg: RectTileLayer
		mid: RectTileLayer
		fg: RectTileLayer
	}
	public static camera: [number, number]
}
