import { GameData } from "./GameData"
import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { Direction } from "./Path"
import { gameContext } from "./GameContext"
import { ScriptTimer } from "./ScriptTimer"
import { ScriptStorage } from "./ScriptStorage"
import { Listener } from "./Listener"

export class GameMap {
	private cells: GameMap.Cell[] = []
	private width: number = 0
	private height: number = 0
	private inViewList: Sprite.Item[]
	/** @internal */
	public readonly alwaysActiveList: Set<Sprite.Item>
	protected frame: number

	constructor() {
		this.inViewList = []
		this.frame = 1
		this.alwaysActiveList = new Set()
	}

	public get tileWidth() {
		return this.width
	}

	public get tileHeight() {
		return this.height
	}

	public get pixelWidth() {
		return this.width * CONST.GRID_BASE
	}

	public get pixelHeight() {
		return this.height * CONST.GRID_BASE
	}

	public loadMap(map: GameData.MapData) {
		const cells: GameMap.Cell[] = new Array(map.width * map.height)
			.fill(null)
			.map((_, i) => new GameMap.Cell(i % map.width, Math.floor(i / map.width)))
		for (let i = 0; i < map.tiles.length; i++) {
			if (map.tiles[i] != 0) {
				cells[i].applyMapData(gameContext.data.sprites[map.tiles[i] - 1])
			}
		}

		this.cells = cells
		this.width = map.width
		this.height = map.height

		const defer: {
			cell: GameMap.Cell
			callback: ScriptStorage.cellStaticCallback
		}[] = []

		for (const object of map.objects) {
			// type asserts seem to be broken with readonly fields
			// hance the casts...
			if ((object as GameData.ItemData).sprite) {
				Sprite.Item.createFromItemData(object as GameData.ItemData)
			} else {
				const scripts = (object as GameData.ScriptData)
				const storage = gameContext.scripts
				const cell = this.getCell(scripts.cell[0], scripts.cell[1])
				if (scripts.onCreate) {
					defer.push({
						cell,
						callback: storage.resolve(scripts.onCreate, "cellCreate")
					})
				}
				if (scripts.onMove) {
					const callback = storage.resolve(scripts.onMove, "cellMove")
					cell.onMove.add((cell, direction) => callback(gameContext, cell, direction))
				}
				if (scripts.onEnter) {
					const callback = storage.resolve(scripts.onEnter, "cellEnter")
					cell.onEnter.add((cell, direction) => callback(gameContext, cell, direction))
				}
				if (scripts.onExit) {
					const callback = storage.resolve(scripts.onExit, "cellExit")
					cell.onExit.add((cell, direction) => callback(gameContext, cell, direction))
				}
				if (scripts.onCenter) {
					const callback = storage.resolve(scripts.onCenter, "cellCenter")
					cell.onCenter.add(cell => callback(gameContext, cell))
				}
				if (scripts.onUse) {
					const callback = storage.resolve(scripts.onUse, "cellUse")
					cell.onUse.add(cell => callback(gameContext, cell))
				}
			}
		}
		defer.forEach(item => item.callback(gameContext, item.cell))
	}

	public update(delta: number, top: number, left: number, bottom: number, right: number) {
		bottom = Math.min(bottom, top + (this.height - 1))
		right = Math.min(right, left + (this.width - 1))
		const items: Sprite.Item[] = []
		for (let row = top; row <= bottom; row++) {
			const offset = (row % this.height) * this.width
			for (let column = left; column <= right; column++) {
				const cell = this.cells[offset + (column % this.width)]
				cell.collect(items)
				cell.timer.update(delta)
			}
		}
		const frame = this.frame
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			item.inView = true
			item.paint = frame
			item.update(delta)
		}
		for (let i = 0; i < this.inViewList.length; i++) {
			if (this.inViewList[i].paint != frame) {
				items[i].inView = false
			}
		}
		for (const item of this.alwaysActiveList) {
			if (!item.inView) {
				item.update(delta)
			}
		}
		items.sort((a, b) => a.zIndex - b.zIndex)
		this.inViewList = items
	}

	public render(top: number, left: number, bottom: number, right: number) {
		const layers = gameContext.layers
		layers.bg.clear()
		layers.mid.clear()
		layers.fg.clear()
		for (let row = top; row <= bottom; row++) {
			const offset = (row % this.height) * this.width
			for (let column = left; column <= right; column++) {
				this.cells[offset + (column % this.width)].render(
					column * CONST.GRID_BASE,
					row * CONST.GRID_BASE
				)
			}
		}
		for (let i = 0; i < this.inViewList.length; i++) {
			const item = this.inViewList[i]
			if (item._cell) {
				item._cell.renderItem(item)
			}
		}
	}

	public getCell(x: number, y: number) {
		return this.cells[x + (y * this.width)]
	}
}

export namespace GameMap {
	export class Cell {
		public readonly x: number
		public readonly y: number
		public readonly timer: ScriptTimer

		private background: Sprite.Background | null = null
		private composite?: Sprite.Background[]
		private items: Sprite.Item[] = []
		private paths?: GameData.PathData
		private visibility: number
		private pointCache: [number, number][]

		private _onMove?: Listener<[Cell, Direction], boolean>
		private _onEnter?: Listener<[Cell, Direction]>
		private _onExit?: Listener<[Cell, Direction]>
		private _onCenter?: Listener<Cell>
		private _onUse?: Listener<Cell>

		// ugly lazy loaders
		public get onMove()   { return this._onMove   || (this._onMove = new Listener())   }
		public get onEnter()  { return this._onEnter  || (this._onEnter = new Listener())  }
		public get onExit()   { return this._onExit   || (this._onExit = new Listener())   }
		public get onCenter() { return this._onCenter || (this._onCenter = new Listener()) }
		public get onUse()    { return this._onUse    || (this._onUse = new Listener())    }

		public constructor(x: number, y: number) {
			this.x = x
			this.y = y
			this.visibility = 0
			this.pointCache = []
			this.timer = new ScriptTimer()
		}

		get visible() {
			return this.visibility >= 128
		}

		public setVisible(direction?: Direction) {
			if (this.composite && direction) {
				const paths = this.composite[0].data.paths!
				if (paths[direction]) {
					this.visibility |= 16
					this.updateConntected(paths)
				} else {
					this.visibility |= 32
					this.updateConntected(this.composite[1].data.paths!)
				}
				if ((this.visibility & (16 + 32)) == (16 + 32)) {
					this.visibility |= 128
				}
			} else {
				this.visibility |= 128
				if (this.paths) {
					this.updateConntected(this.paths)
				}
			}
		}

		private updateConntected(paths: GameData.PathData) {
			const map = gameContext.map
			if (paths.down) {
				map.getCell(this.x, (this.y + (map.tileHeight - 1)) % map.tileHeight).showPlug("down")
			}
			if (paths.up) {
				map.getCell(this.x, (this.y + 1) % map.tileHeight).showPlug("up")
			}
			if (paths.right) {
				map.getCell((this.x + (map.tileWidth - 1)) % map.tileWidth, this.y).showPlug("right")
			}
			if (paths.left) {
				map.getCell((this.x + 1) % map.tileWidth, this.y).showPlug("left")
			}
		}

		/** @internal */
		public showPlug(direction: Direction) {
			if (this.paths) {
				switch (direction) {
					case "up":
						this.visibility |= Sprite.Background.Plug.UP
						break
					case "down":
						this.visibility |= Sprite.Background.Plug.DOWN
						break
					case "left":
						this.visibility |= Sprite.Background.Plug.LEFT
						break
					case "right":
						this.visibility |= Sprite.Background.Plug.RIGHT
						break
				}
			}
		}

		public applyMapData(sprite: GameData.SpriteData) {
			this.background = Sprite.Background.create(sprite)
			this.paths = sprite.paths
			if (sprite.composite) {
				this.composite = sprite.composite
					.map(name => Sprite.Background.create(Sprite.find(name)))
			}
			if (this.background.onCreate) {
				void this.background.onCreate(gameContext, this)
			}
		}

		/** @internal */
		public collect(result: Sprite.Item[]) {
			if (this.pointCache.length) {
				this.pointCache = []
			}
			if (this.items.length) {
				for (let i = 0; i < this.items.length; i++) {
					result.push(this.items[i])
				}
			}
		}

		/** @internal */
		public renderItem(item: Sprite.Item) {
			const cache = this.pointCache
			for (let i = 0; i < this.pointCache.length; i++) {
				item.render(cache[i][0], cache[i][1])
			}
		}

		/** @internal */
		public render(x: number, y: number) {
			if (this.visibility >= 128) {
				if (this.background) {
					this.background.render(x, y)
				}
				if (this.items.length) {
					this.pointCache.push([x, y])
				}
			} else if ((this.visibility < 16) && this.background) {
				this.background.renderPlugs(x, y, this.visibility)
			} else if (this.composite && (this.visibility >= 16)) {
				if ((this.visibility & 16) == 16) {
					this.composite[0].render(x, y)
					this.composite[1].renderPlugs(x, y, this.visibility)
				} else {
					this.composite[1].render(x, y)
					this.composite[0].renderPlugs(x, y, this.visibility)
				}
				if (this.items.length) {
					this.pointCache.push([x, y])
				}
			}
		}

		public getCenter() {
			if (this.paths) {
				const path = this.paths.up || this.paths.down || this.paths.left || this.paths.right!
				return path[path.length - 1]
			}
			return undefined
		}

		public getEnterPath(direction: Direction) {
			if (this.paths) {
				return this.paths[direction]
			}
			return undefined
		}

		public getExitPath(direction: Direction, x: number, y: number) {
			if (this.paths) {
				let path
				switch (direction) {
					case "up":
						path = this.paths.down
						break
					case "down":
						path = this.paths.up
						break
					case "left":
						path = this.paths.right
						break
					case "right":
						path = this.paths.left
						break
				}
				if (path) {
					const last = path[path.length - 1]
					if ((last[0] == x) && (last[1] == y)) {
						return path.slice(0).reverse()
					}
				}
			}
			return undefined
		}

		public addItem(item: Sprite.Item) {
			if (item._cell) {
				item._cell.removeItem(item)
			}
			item._cell = this
			this.items.push(item)
		}

		public removeItem(item: Sprite.Item) {
			if (this.items.length == 0) {
				return false
			} else if (this.items[this.items.length - 1] == item) {
				this.items.pop()
				return true
			} else {
				const i = this.items.indexOf(item)
				if (i >= 0) {
					this.items.splice(i, 1)
					return true
				}
				return false
			}
		}
	}
}
