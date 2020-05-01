import { RectTileLayer } from "./RectTile/RectTileLayer"
import * as Stats from "stats.js"

import { GameData } from "./GameData"
import { GameInput } from "./GameInput"
import { GameContext } from "./GameContext"
import { GameMap } from "./GameMap"
import { Sprite } from "./Sprite"
import { modulo } from "./utils"
import { CONST } from "./Constants"

export class Player extends Sprite.Walking {
	public update(time: number) {
		super.update(time)
		if (!this.isMoving()) {
			if (GameContext.input.keyboard.ArrowUp) {
				this.walk("up")
			} else if (GameContext.input.keyboard.ArrowDown) {
				this.walk("down")
			} else if (GameContext.input.keyboard.ArrowLeft) {
				this.walk("left")
			} else if (GameContext.input.keyboard.ArrowRight) {
				this.walk("right")
			}
		}
	}
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
	GameContext.input = new GameInput()
	GameContext.input.register()
	GameContext.time = 0
	GameContext.map = new GameMap()
	GameContext.map.loadMap(GameContext.data.map)
	GameContext.camera = [300, 300]
	const player = new Player(Sprite.WalkSequence.find("khajiit"), 25)
	player.enable(2, 1)
	let scale = 2
	app.stage.scale.set(scale)
	app.ticker.add((_delta) => {
		stats.end()
		stats.begin()
		if (GameContext.input.keyboard["+"]) {
			scale *= 1.05
			app.stage.scale.set(scale)
		}
		if (GameContext.input.keyboard["-"]) {
			scale *= 0.95
			app.stage.scale.set(scale)
		}
		if (GameContext.input.keyboard["0"]) {
			scale = 2
			app.stage.scale.set(scale)
		}
		GameContext.time += app.ticker.elapsedMS
		player.update(GameContext.time)
		GameContext.camera = player.getAbsoluteLocation()
		const screenWidth = app.view.width * (1 / scale)
		const screenHeight = app.view.height * (1 / scale)
		const left = modulo(GameContext.camera[0] - (screenWidth /  2), GameContext.map.pixelWidth)
		const top = modulo(GameContext.camera[1] - (screenHeight /  2), GameContext.map.pixelHeight)
		GameContext.map.render(
			Math.floor(top / CONST.GRID_BASE),
			Math.floor(left / CONST.GRID_BASE),
			Math.floor((top + (screenHeight - 1)) / Math.floor(CONST.GRID_BASE)),
			Math.floor((left + (screenWidth - 1)) / Math.floor(CONST.GRID_BASE))
		)
		app.stage.pivot.set(left, top)
	})
})
