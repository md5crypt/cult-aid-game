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
import { Direction } from "./Path"

// inject gameContext into window
(window as any).gameContext = gameContext

export class Player extends Sprite.Character {

	public constructor(walkSequence: Sprite.WalkSequence, speed = CONST.WALK_BASE_SPEED) {
		super(walkSequence, speed)
		this.onUpdate.add(() => {
			if (!this.moving) {
				this.checkInput()
			}
		})
	}

	private checkInput() {
		if (gameContext.input.keyboard.ArrowUp) {
			this.walk("up")
		} else if (gameContext.input.keyboard.ArrowDown) {
			this.walk("down")
		} else if (gameContext.input.keyboard.ArrowLeft) {
			this.walk("left")
		} else if (gameContext.input.keyboard.ArrowRight) {
			this.walk("right")
		}
	}

	public walk(direction: Direction) {
		const value = super.walk(direction)
		if (value) {
			value.onEnd.add(() => this.checkInput())
		}
		return value
	}

	protected onCellChange() {
		if (this.cell) {
			this.cell.setVisible(this.moveDirection)
		}
	}
}

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
	gameContext.camera = [300, 300]
	gameContext.player = new Player(Sprite.WalkSequence.find("khajiit"), 25)
	gameContext.player.enable(2, 1)
	gameContext.scripts = new ScriptStorage()
	gameContext.scripts.load(resources.scripts!.data)
	let scale = 2
	app.stage.scale.set(scale)
	app.ticker.add((_delta) => {
		stats.end()
		stats.begin()
		let snap = true
		if (gameContext.input.keyboard["+"]) {
			scale *= 1.05
			snap = false
			app.stage.scale.set(scale)
		}
		if (gameContext.input.keyboard["-"]) {
			scale *= 0.95
			snap = false
			app.stage.scale.set(scale)
		}
		if (gameContext.input.keyboard["0"]) {
			scale = 2
			app.stage.scale.set(scale)
		}
		gameContext.time += app.ticker.elapsedMS
		gameContext.camera = gameContext.player.getAbsoluteLocation()
		const screenWidth = app.view.width * (1 / scale)
		const screenHeight = app.view.height * (1 / scale)
		const left = modulo(gameContext.camera[0] - (screenWidth /  2), gameContext.map.pixelWidth)
		const top = modulo(gameContext.camera[1] - (screenHeight /  2), gameContext.map.pixelHeight)
		const bounds = [
			Math.floor(top / CONST.GRID_BASE),
			Math.floor(left / CONST.GRID_BASE),
			Math.floor((top + (screenHeight - 1)) / CONST.GRID_BASE),
			Math.floor((left + (screenWidth - 1)) / CONST.GRID_BASE)
		] as const
		gameContext.map.update(app.ticker.elapsedMS, ...bounds)
		gameContext.map.render(...bounds)
		if (snap) {
			//app.stage.pivot.set(Math.floor(left), Math.floor(top))
			app.stage.pivot.set(left, top)
		} else {
			app.stage.pivot.set(left, top)
		}
	})
})
