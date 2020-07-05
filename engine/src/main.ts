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
import { BitmapFont, FontData } from "./Text/BitmapFont"
import { layoutFactory } from "./Layout/LayoutPIXI"
import { TextureStorage } from "./Resources"
import { Speech } from "./Speech"
import { DialogUI } from "./UI/DialogUI"
import { Animator } from "./UI/Animator"
import "./TextureAtlasLoader"
import "./RectTile/RectTileRenderer"

declare global {
	interface Window {
		gameContext: GameContext
		app: PIXI.Application
	}
}

Object.assign(gameContext, {
	Item: Sprite.Item,
	Speech: Speech,
	Path: SimplePath,
	Animation,
	Sprite
})

function loadResources(app: PIXI.Application) : Promise<Partial<Record<string, PIXI.LoaderResource>>> {
	return new Promise((resolve, reject) => app.loader
		.add("atlasUi", "atlas-ui.json")
		.add("atlasTiles", "atlas-tiles.json")
		.add("gameData", "data.json")
		.add("fonts", "fonts.json")
		.add("scripts", "scripts.js")
		.load((_loader, resources) => resolve(resources))
		.onError.add(error => reject(error))
	)
}

function resize(app: PIXI.Application) {
	app.view.width = window.innerWidth
	app.view.height = window.innerHeight
	app.view.style.overflow = "hidden"
	app.view.style.width = window.innerWidth + "px"
	app.view.style.height = window.innerHeight + "px"
	const resolution = window.devicePixelRatio || 1
	const width = window.innerWidth * resolution
	const height = window.innerHeight * resolution
	const scale = Math.max(1, Math.floor(width / 683))
	gameContext.stage.ui.scale.set(scale)
	gameContext.ui.root.updateConfig({
		width: Math.floor(width / scale),
		height: Math.floor(height / scale)
	})
	gameContext.camera.updateScreenSize(
		width / CONST.STAGE_BASE_ZOOM,
		height / CONST.STAGE_BASE_ZOOM
	)
	gameContext.camera.zoomDefault = scale
	app.renderer.resize(width, height)
}

function bootstrap(app: PIXI.Application, resources: Record<string, PIXI.LoaderResource>) {
	window.app = app
	window.gameContext = gameContext
	gameContext.data = resources.gameData.data.data as GameData
	gameContext.textures = {
		ui: resources.atlasUi.data as TextureStorage,
		tiles: resources.atlasTiles.data as TextureStorage
	}
	gameContext.layers = {
		bg: new RectTileLayer(gameContext.textures.tiles.baseTextures),
		mid: new RectTileLayer(gameContext.textures.tiles.baseTextures),
		fg: new RectTileLayer(gameContext.textures.tiles.baseTextures)
	}
	gameContext.scripts = new ScriptStorage()
	gameContext.input = new GameInput()
	gameContext.map = new GameMap()
	gameContext.camera = new GameCamera()
	gameContext.timer = new ScriptTimer()
	gameContext.input.register()
	gameContext.time = 0;
	(resources.fonts.data.data as FontData[]).forEach(font => BitmapFont.register(font, gameContext.textures.ui))
	const tile = new PIXI.Container()
	tile.interactive = false
	tile.addChild(...Object.values(gameContext.layers))
	BitmapFont.alias("default", "PixAntiqua")
	gameContext.ui = {} as any
	gameContext.ui.root = layoutFactory.create({
		name: "@root",
		type: "container"
	})
	gameContext.ui.dialog = new DialogUI()
	gameContext.stage = {tile, ui: gameContext.ui.root.handle}
	resize(app)
	app.stage.addChild(...Object.values(gameContext.stage))
}

window.addEventListener("load", async () => {
	const stats = new Stats()
	stats.showPanel(0)
	document.body.appendChild(stats.dom)
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
	PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF
	PIXI.settings.ROUND_PIXELS = true
	const app = new PIXI.Application({
		backgroundColor: 0
	})
	document.body.appendChild(app.view)
	const resources = await loadResources(app) as Record<string, PIXI.LoaderResource>
	bootstrap(app, resources)
	resize(app)

	gameContext.player = new Player(Sprite.WalkSequence.find("khajiit"), 25)
	gameContext.scripts.load(resources.scripts.data)
	gameContext.map.loadMap(gameContext.data.map)

	app.ticker.add(() => {
		stats.begin()
		const delta = app.ticker.elapsedMS
		gameContext.time += delta
		gameContext.camera.update(delta)
		const zoom = gameContext.camera.zoom * CONST.STAGE_BASE_ZOOM
		const pivot = gameContext.camera.position
		const screenWidth = app.renderer.width
		const screenHeight = app.renderer.height
		const left = modulo(pivot[0] - ((screenWidth >> 1) * (1 / zoom)), gameContext.map.pixelWidth)
		const top = modulo(pivot[1] - ((screenHeight >> 1) * (1 / zoom)), gameContext.map.pixelHeight)
		const bounds = [
			Math.floor(top / CONST.GRID_BASE),
			Math.floor(left / CONST.GRID_BASE),
			Math.floor((top + ((screenHeight * (1 / zoom)) - 1)) / CONST.GRID_BASE),
			Math.floor((left + ((screenWidth * (1 / zoom)) - 1)) / CONST.GRID_BASE)
		] as const
		gameContext.timer.update(delta)
		gameContext.map.update(delta, ...bounds)
		gameContext.map.render(...bounds)
		gameContext.stage.tile.scale.set(zoom)
		gameContext.stage.tile.pivot.set(left, top)
		Animator.update()
		gameContext.ui.root.update()
		stats.end()
	})

	class Throttle {
		private callback: () => void
		private timeout: NodeJS.Timeout | null
		private amount: number
		private flag: boolean

		public constructor(callback: () => void, amount: number) {
			this.amount = amount
			this.callback = callback
			this.timeout = null
			this.flag = false
		}

		public invoke() {
			if (this.timeout == null) {
				this.callback()
				this.timeout = setTimeout(() => {
					this.timeout = null
					if (this.flag) {
						this.callback()
						this.flag = false
					}
				}, this.amount)
			} else {
				this.flag = true
			}
		}
	}

	const reSizer = new Throttle(() => resize(app), 100)

	window.addEventListener("resize", () => reSizer.invoke())
})
