import { RectTileLayer } from "./RectTile/RectTileLayer"
import * as Stats from "stats.js"

import { GameData } from "./GameData"
import { GameInput } from "./GameInput"
import { GameMap } from "./GameMap"
import { Sprite } from "./Sprite"
import { modulo } from "./utils"
import { CONST } from "./Constants"
import { gameContext } from "./GameContext"
import { ScriptStorage } from "./ScriptStorage"
import { Player } from "./Player"
import { GameCamera } from "./GameCamera"

// inject gameContext into window
(window as any).gameContext = gameContext

function loadResources(app: PIXI.Application) : Promise<Partial<Record<string, PIXI.LoaderResource>>> {
	return new Promise((resolve, reject) => app.loader
		.add("atlas", "atlas.png")
		.add("data", "data.json")
		.add("scripts", "scripts.js")
		.load((_loader, resources) => resolve(resources))
		.on("error", error => reject(error))
	)
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
	gameContext.data = resources.data!.data as GameData
	gameContext.layers = {
		bg: new RectTileLayer(resources.atlas!.texture),
		mid: new RectTileLayer(resources.atlas!.texture),
		fg: new RectTileLayer(resources.atlas!.texture)
	}
	app.stage.addChild(gameContext.layers.bg)
	app.stage.addChild(gameContext.layers.mid)
	app.stage.addChild(gameContext.layers.fg)
	gameContext.input = new GameInput()
	gameContext.input.register()
	gameContext.time = 0
	gameContext.map = new GameMap()
	gameContext.map.loadMap(gameContext.data.map)
	gameContext.camera = new GameCamera()
	gameContext.player = new Player(Sprite.WalkSequence.find("khajiit"), 25)
	gameContext.player.enable(2, 1)
	gameContext.scripts = new ScriptStorage()
	gameContext.scripts.load(resources.scripts!.data)
	gameContext.camera.lockOn(gameContext.player)
	app.ticker.add((_delta) => {
		stats.end()
		stats.begin()
		gameContext.time += app.ticker.elapsedMS
		gameContext.camera.update(app.ticker.elapsedMS)
		const zoom = gameContext.camera.zoom * CONST.BASE_ZOOM
		const pivot = gameContext.camera.pivot
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
		gameContext.map.update(app.ticker.elapsedMS, ...bounds)
		gameContext.map.render(...bounds)
		app.stage.scale.set(zoom)
		app.stage.pivot.set(left, top)
	})
})
