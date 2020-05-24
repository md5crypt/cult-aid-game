import { RectTileLayer } from "./RectTile/RectTileLayer"
import * as Stats from "stats.js"

import { GameData } from "./GameData"
import { GameInput } from "./GameInput"
import { GameMap } from "./GameMap"
import { Sprite } from "./Sprite"
import { modulo } from "./utils"
import { CONST } from "./Constants"
import { gameContext, GameContext } from "./GameContext"
import { ScriptStorage } from "./ScriptStorage"
import { Player } from "./Player"
import { GameCamera } from "./GameCamera"
import { ScriptTimer } from "./ScriptTimer"
import { SimplePath } from "./Path"
import { Animation } from "./Animation"

declare global {
	interface Window {
		gameContext: GameContext
		app: PIXI.Application
	}
}

Object.assign(gameContext, {
	Item: Sprite.Item,
	Character: Sprite.Character,
	Path: SimplePath,
	Animation,
	Sprite
})

function loadResources(app: PIXI.Application) : Promise<Partial<Record<string, PIXI.LoaderResource>>> {
	return new Promise((resolve, reject) => app.loader
		.add("atlas", "atlas.png")
		.add("data", "data.json")
		.add("scripts", "scripts.js")
		.load((_loader, resources) => resolve(resources))
		.on("error", error => reject(error))
	)
}

function bootstrap(app: PIXI.Application, data: GameData, texture: PIXI.Texture) {
	gameContext.data = data
	gameContext.layers = {
		bg: new RectTileLayer(texture),
		mid: new RectTileLayer(texture),
		fg: new RectTileLayer(texture)
	}
	gameContext.scripts = new ScriptStorage()
	gameContext.input = new GameInput()
	gameContext.map = new GameMap()
	gameContext.camera = new GameCamera()
	gameContext.timer = new ScriptTimer()
	gameContext.input.register()
	gameContext.time = 0
	const tile = new PIXI.Container()
	tile.interactive = false
	tile.addChild(gameContext.layers.bg)
	tile.addChild(gameContext.layers.mid)
	tile.addChild(gameContext.layers.fg)
	app.stage.addChild(tile)
	const UI = new PIXI.Container()
	app.stage.addChild(UI)
	gameContext.stage = {tile, UI}
	window.app = app
	window.gameContext = gameContext
}

window.addEventListener("load", async () => {
	const stats = new Stats()
	stats.showPanel(0)
	document.body.appendChild(stats.dom)
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
	const app = new PIXI.Application({
		width: 800,
		height: 600,
		backgroundColor: 0,
		resolution: 1
	})
	document.body.appendChild(app.view)
	const resources = await loadResources(app)
	bootstrap(app, resources.data!.data, resources.atlas!.texture)
	gameContext.player = new Player(Sprite.WalkSequence.find("khajiit"), 25)
	gameContext.scripts.load(resources.scripts!.data)
	gameContext.map.loadMap(gameContext.data.map)
	gameContext.camera.updateScreenSize(
		app.view.width / CONST.STAGE_BASE_ZOOM,
		app.view.height / CONST.STAGE_BASE_ZOOM
	)
	app.ticker.add(() => {
		stats.begin()
		const delta = app.ticker.elapsedMS
		gameContext.time += delta
		gameContext.camera.update(delta)
		const zoom = gameContext.camera.zoom * CONST.STAGE_BASE_ZOOM
		const pivot = gameContext.camera.position
		const screenWidth = app.view.width * (1 / zoom)
		const screenHeight = app.view.height * (1 / zoom)
		const left = modulo(pivot[0] - (screenWidth /  2), gameContext.map.pixelWidth)
		const top = modulo(pivot[1] - (screenHeight /  2), gameContext.map.pixelHeight)
		const bounds = [
			Math.floor(top / CONST.GRID_BASE),
			Math.floor(left / CONST.GRID_BASE),
			Math.floor((top + (screenHeight - 1)) / CONST.GRID_BASE),
			Math.floor((left + (screenWidth - 1)) / CONST.GRID_BASE)
		] as const
		gameContext.timer.update(delta)
		gameContext.map.update(delta, ...bounds)
		gameContext.map.render(...bounds)
		gameContext.stage.tile.scale.set(zoom)
		gameContext.stage.tile.pivot.set(left, top)
		stats.end()
	})
})
