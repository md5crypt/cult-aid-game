import { RectTileLayer } from "./RectTile/RectTileLayer"
import * as Stats from "stats.js"

import { GameData } from "./GameData"
import { GameContext } from "./GameContext"
import { GameMap } from "./GameMap"
import { Sprite } from "./Sprite"

const enum CONST {
	GRID_BASE = 120,
	WALK_SPEED = 10
}

function modulo (a: number, b: number) {
	const r = a % b
	return r >= 0 ? r : b + r
}

function loadResources(app: PIXI.Application) : Promise<Partial<Record<string, PIXI.LoaderResource>>> {
	return new Promise((resolve, reject) => app.loader
		.add("atlas", "atlas.png")
		.add("data", "data.json")
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
		width: 801,
		height: 601,
		backgroundColor: 0,
		resolution: 1
	})
	document.body.appendChild(app.view)
	const resources = await loadResources(app)
	GameContext.data = resources.data!.data as GameData
	GameContext.layers = {
		bg: new RectTileLayer(resources.atlas!.texture),
		mid: new RectTileLayer(resources.atlas!.texture),
		fg: new RectTileLayer(resources.atlas!.texture)
	}
	app.stage.addChild(GameContext.layers.bg)
	app.stage.addChild(GameContext.layers.mid)
	app.stage.addChild(GameContext.layers.fg)
	GameContext.map = new GameMap()
	GameContext.map.loadMap(GameContext.data.map)
	GameContext.map.getCell(0, 0).item.push(new Sprite.Advanced(Sprite.find("khajiit-idle")))
	GameContext.map.getCell(0, 2).item.push(new Sprite.Advanced(Sprite.find("khajiit-idle")))
	GameContext.map.getCell(3, 2).item.push(new Sprite.Advanced(Sprite.find("khajiit-idle")))
	GameContext.time = 0
	GameContext.camera = [0, 0]
	app.ticker.add((delta) => {
		GameContext.time += app.ticker.elapsedMS
		stats.end()
		stats.begin()
		GameContext.camera[0] += delta
		GameContext.camera[1] += delta
		const left = modulo(Math.floor(GameContext.camera[0] - (app.view.width / 2)), GameContext.map.xSize)
		const top = modulo(Math.floor(GameContext.camera[1] - (app.view.height / 2)), GameContext.map.ySize)
		GameContext.map.render(
			Math.floor(top / CONST.GRID_BASE),
			Math.floor(left / CONST.GRID_BASE),
			Math.floor((top + (app.view.height - 1)) / CONST.GRID_BASE),
			Math.floor((left + (app.view.width - 1)) / CONST.GRID_BASE)
		)
		app.stage.pivot.set(left, top)
	})
})
