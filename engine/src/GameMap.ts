import { GameData } from "./GameData"
import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { Direction } from "./Path"
import { gameContext } from "./GameContext"
import { ScriptTimer } from "./ScriptTimer"
import { ScriptStorage } from "./ScriptStorage"
import { NavMapRect } from "./NavMap"
import { Listener } from "./Listener"
import { modulo } from "./utils"

interface GameMapPosition {
	readonly offset: readonly [number, number]
	readonly zIndex: number
	readonly cell: GameMap.Cell
}

export class GameMap {
	private _cells: GameMap.Cell[] = []
	private width: number = 0
	private height: number = 0
	private inViewList: Sprite.Item[]
	private activeZoneList: GameMap.ZoneNavMap[]
	private namedPositions: Map<string, GameMapPosition>
	private namedItems: Map<string, Sprite.Item>
	private namedZones: Map<string, GameMap.ZoneNavMap>

	/** @internal */
	public readonly alwaysActiveList: Set<Sprite.Item>
	/** @internal */
	public frame: number

	constructor() {
		this.inViewList = []
		this.activeZoneList = []
		this.frame = 1
		this.alwaysActiveList = new Set()
		this.namedPositions = new Map()
		this.namedItems = new Map()
		this.namedZones = new Map()
	}

	public get cells() {
		return this._cells as readonly GameMap.Cell[]
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

		this._cells = cells
		this.width = map.width
		this.height = map.height

		const defer: {
			cell: GameMap.Cell
			callback: ScriptStorage.cellStaticCallback
		}[] = []

		this.namedPositions.clear()
		this.namedItems.clear()

		for (const object of map.objects) {
			switch (object.type) {
				case "item":
					const item = Sprite.Item.createFromItemData(object)
					if (object.name) {
						this.namedItems.set(object.name, item)
					}
					break
				case "point":
					this.namedPositions.set(object.name, {
						offset: [object.position[0] % CONST.GRID_BASE, object.position[1] % CONST.GRID_BASE],
						cell: this.getCell(
							Math.floor(object.position[0] / CONST.GRID_BASE),
							Math.floor(object.position[1] / CONST.GRID_BASE)
						),
						zIndex: object.zIndex || 0
					})
					break
				case "script":
					const storage = gameContext.scripts
					const cell = this.getCell(object.cell[0], object.cell[1])
					if (object.onCreate) {
						defer.push({
							cell,
							callback: storage.resolveOrThrow("cellCreate", object.onCreate)
						})
					}
					if (object.onEnter) {
						cell.onEnter.add(storage.resolveOrThrow("cellEnter", object.onEnter))
					}
					if (object.onExit) {
						cell.onExit.add(storage.resolveOrThrow("cellExit", object.onExit))
					}
					if (object.onUse) {
						cell.onUse.add(storage.resolveOrThrow("cellUse", object.onUse))
					}
					break
				case "zone":
					const zone = GameMap.ZoneNavMap.create(object)
					if (object.name) {
						this.namedZones.set(object.name, zone)
					}
					const xStop = Math.floor((zone.x + zone.width) / CONST.GRID_BASE)
					const yStop = Math.floor((zone.y + zone.height) / CONST.GRID_BASE)
					for (let y = Math.floor(zone.y / CONST.GRID_BASE); y <= yStop; y += 1) {
						for (let x = Math.floor(zone.x / CONST.GRID_BASE); x <= xStop; x += 1) {
							this.getCell(x % this.width, y % this.height).addZone(zone)
						}
					}
					break
				default:
					console.error(object)
					throw new Error("invalid map object")
			}
		}
		defer.forEach(item => item.callback(item.cell))
	}

	public update(delta: number, top: number, left: number, bottom: number, right: number) {
		bottom = Math.min(bottom, top + (this.height - 1))
		right = Math.min(right, left + (this.width - 1))
		const items: Sprite.Item[] = []
		for (let row = top; row <= bottom; row++) {
			const offset = (row % this.height) * this.width
			for (let column = left; column <= right; column++) {
				const cell = this._cells[offset + (column % this.width)]
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
				this._cells[offset + (column % this.width)].render(
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
		this.frame += 1
	}

	public updateZones(cell: GameMap.Cell, offset: readonly [number, number]) {
		const zones = cell.collectZones(offset)
		for (let i = 0; i < zones.length; i += 1) {
			zones[i].paint = this.frame
		}
		for (let i = 0; i < this.activeZoneList.length; i += 1) {
			const zone = this.activeZoneList[i]
			if (zone.paint != this.frame) {
				zone.active = false
				zone.onExit.invoke(zone)
			}
		}
		for (let i = 0; i < zones.length; i += 1) {
			const zone = zones[i]
			if (!zone.active) {
				zone.active = true
				zone.onEnter.invoke(zone)
			}
		}
		this.activeZoneList = zones
	}

	public triggerZones() {
		for (let i = 0; i < this.activeZoneList.length; i += 1) {
			const zone = this.activeZoneList[i]
			zone.onUse.invoke(zone)
		}
	}

	public getPositionByName(name: string) {
		const cell = this.namedPositions.get(name)
		if (!cell) {
			throw new Error(`position '${name}' not found`)
		}
		return cell
	}

	public getItemByName(name: string) {
		const item = this.namedItems.get(name)
		if (!item) {
			throw new Error(`item '${name}' not found`)
		}
		return item
	}

	public getCell(x: number, y: number) {
		return this._cells[x + (y * this.width)]
	}

	public getClampedCell(x: number, y: number) {
		return this._cells[modulo(x, this.width) + (modulo(y, this.height) * this.width)]
	}
}

export namespace GameMap {
	const enum CellVisibility {
		PLUG_UP = Sprite.Background.Plug.UP,
		PLUG_DOWN = Sprite.Background.Plug.DOWN,
		PLUG_LEFT = Sprite.Background.Plug.LEFT,
		PLUG_RIGHT = Sprite.Background.Plug.RIGHT,
		PLUG_MASK = PLUG_UP | PLUG_DOWN | PLUG_LEFT | PLUG_RIGHT,
		FULL = 128,
	}

	export class ZoneNavMap extends NavMapRect {
		public onEnter: Listener<ZoneNavMap>
		public onExit: Listener<ZoneNavMap>
		public onUse: Listener<ZoneNavMap>
		public enabled: boolean
		public paint: number
		public active: boolean

		private constructor(navMapRect: NavMapRect, offset: readonly [number, number]) {
			super(navMapRect, offset)
			this.enabled = true
			this.paint = 0
			this.active = false
			this.onEnter = new Listener()
			this.onExit = new Listener()
			this.onUse = new Listener()
		}

		public static create(data: GameData.ZoneData) {
			const zone = new ZoneNavMap(gameContext.navMap.getOrThrow(data.resource), data.position)
			const storage = gameContext.scripts
			if (data.onEnter) {
				zone.onEnter.add(storage.resolveOrThrow("zoneEnter", data.onEnter))
			}
			if (data.onExit) {
				zone.onExit.add(storage.resolveOrThrow("zoneExit", data.onExit))
			}
			if (data.onUse) {
				zone.onUse.add(storage.resolveOrThrow("zoneUse", data.onUse))
			}
			if (data.enabled !== undefined){
				zone.enabled = data.enabled
			}
			return zone
		}
	}

	export class Cell {
		public readonly x: number
		public readonly y: number
		public readonly timer: ScriptTimer

		private background: Sprite.Background | null = null

		private visibility: number
		private pointCache: [number, number][]
		private navMap?: NavMapRect
		private zones: ZoneNavMap[]

		private _items: Sprite.Item[] = []
		public onEnter: Listener<[Cell, Direction]>
		public onExit: Listener<[Cell, Direction]>
		public onUse: Listener<Cell>

		private static readonly plugMap = {
			"up": CellVisibility.PLUG_UP,
			"down": CellVisibility.PLUG_DOWN,
			"left": CellVisibility.PLUG_LEFT,
			"right": CellVisibility.PLUG_RIGHT
		} as const

		public constructor(x: number, y: number) {
			this.x = x
			this.y = y
			this.visibility = 0
			this.pointCache = []
			this.timer = new ScriptTimer()
			this.onEnter = new Listener()
			this.onExit = new Listener()
			this.onUse = new Listener()
			this.zones = []
		}

		public get data() {
			return this.background?.data
		}

		public get visible() {
			return this.visibility >= CellVisibility.FULL
		}

		public set visible(value: boolean) {
			if (!(this.visibility & CellVisibility.FULL) == value) {
				this.visibility = value ? CellVisibility.FULL : 0
				if (this.navMap) {
					const map = gameContext.map
					const navMap = this.navMap
					if (navMap.junctionTop) {
						map.getCell(this.x, (this.y + (map.tileHeight - 1)) % map.tileHeight).setPlug("down", value)
					}
					if (navMap.junctionBottom) {
						map.getCell(this.x, (this.y + 1) % map.tileHeight).setPlug("up", value)
					}
					if (navMap.junctionLeft) {
						map.getCell((this.x + (map.tileWidth - 1)) % map.tileWidth, this.y).setPlug("right", value)
					}
					if (navMap.junctionRight) {
						map.getCell((this.x + 1) % map.tileWidth, this.y).setPlug("left", value)
					}
				}
			}
		}

		public setPlug(direction: Direction, value: boolean) {
			if (this.navMap) {
				if (value) {
					this.visibility |= this.data?.autoReveal ? CellVisibility.FULL : Cell.plugMap[direction]
				} else {
					this.visibility &= ~Cell.plugMap[direction]
				}
			}
		}

		public applyMapData(sprite: GameData.SpriteData) {
			this.background = Sprite.Background.create(sprite)
			this.navMap = sprite.resource ? gameContext.navMap.get(sprite.resource) : undefined
			if (this.background.onCreate) {
				void this.background.onCreate(this)
			}
		}

		public addZone(zone: GameMap.ZoneNavMap) {
			this.zones.push(zone)
		}

		/** @internal */
		public collectZones(offset: readonly [number, number]) {
			const activeZones = []
			const x = this.x * CONST.GRID_BASE + Math.floor(offset[0])
			const y = this.y * CONST.GRID_BASE + Math.floor(offset[1])
			for (let i = 0; i < this.zones.length; i += 1) {
				const zone = this.zones[i]
				if (zone.enabled && zone.contains(x, y)) {
					activeZones.push(zone)
				}
			}
			return activeZones
		}

		/** @internal */
		public collect(result: Sprite.Item[]) {
			if (this.pointCache.length) {
				this.pointCache = []
			}
			if (this._items.length) {
				for (let i = 0; i < this._items.length; i++) {
					const item = this._items[i]
					if (item.enabled) {
						result.push(this._items[i])
					}
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
			if (this.visibility & CellVisibility.FULL) {
				if (this.background) {
					this.background.render(x, y)
				}
				if (this._items.length) {
					this.pointCache.push([x, y])
				}
			} else if (this.background) {
				this.background.renderPlugs(x, y, this.visibility)
			}
		}

		public getItem(name: string) {
			return this._items.find(item => item.name == name)
		}

		public get items() {
			return this._items as readonly Sprite.Item[]
		}

		public addItem(item: Sprite.Item) {
			if (item._cell) {
				item._cell.removeItem(item)
			}
			item._cell = this
			this._items.push(item)
		}

		public removeItem(item: Sprite.Item) {
			if (this._items.length == 0) {
				return false
			} else if (this._items[this._items.length - 1] == item) {
				this._items.pop()!._cell = undefined
				return true
			} else {
				const i = this._items.indexOf(item)
				if (i >= 0) {
					this._items[i]._cell = undefined
					this._items.splice(i, 1)
					return true
				}
				return false
			}
		}

		public clearItems() {
			this._items.forEach(item => item._cell = undefined)
			this._items = []
		}

		public getNeighbor(direction: Direction) {
			let offsetX = 0
			let offsetY = 0
			switch (direction) {
				case "up":
					offsetY = -1
					break
				case "down":
					offsetY = 1
					break
				case "left":
					offsetX = -1
					break
				case "right":
					offsetX = 1
					break
			}
			return gameContext.map.getClampedCell(this.x + offsetX, this.y + offsetY)
		}

		/*private getGroupNeighbor(direction: Direction) {
			if (!this.background || !this.paths) {
				return null
			}
			const data = this.background.data
			if (this.getEnterPath(direction) && (data.gateway != direction)) {
				const cell = this.getNeighbor(direction)
				if (cell.background && (cell.background.data.group == data.group)) {
					return cell
				}
			}
			return null
		}*/

		public get group() {
			const cells: Set<Cell> = new Set()
			const stack = [this] as Cell[]
			const directions = ["up", "down", "left", "right"] as const
			const group = this.background?.data.group
			if (!group) {
				return cells
			}
			while (stack.length) {
				const current = stack.pop()!
				cells.add(current)
				for (const direction of directions) {
					const cell = current.getNeighbor(direction)
					if (cell?.background?.data.group == group && !cells.has(cell)) {
						stack.push(cell)
					}
				}
			}
			return cells
		}

		public getGroupBounds(cells?: Set<Cell>) {
			const xSet = new Set<number>()
			const ySet = new Set<number>()
			for (const cell of (cells || this.group)) {
				xSet.add(cell.x)
				ySet.add(cell.y)
			}
			const findLowerBound = (points: number[]) => {
				for (let i = 0; i < points.length - 1; i++) {
					if ((points[i] + 1) != points[i + 1]) {
						return points[i + 1]
					}
				}
				return points[0]
			}
			return [
				findLowerBound(Array.from(xSet.values()).sort()),
				findLowerBound(Array.from(ySet.values()).sort()),
				xSet.size,
				ySet.size
			]
		}

		/*public getNeighborCell(x: number, y: number) {
			return gameContext.map.getClampedCell(this.x + x, this.y + y)
		}*/

		public getCellContainingPoint(x: number, y: number) {
			if (x >= CONST.GRID_BASE || x < 0 || y >= CONST.GRID_BASE || y < 0) {
				return gameContext.map.getClampedCell(
					this.x + Math.floor(x / CONST.GRID_BASE),
					this.y + Math.floor(y / CONST.GRID_BASE)
				)
			}
			return this
		}

		public isPointTraversable(x: number, y: number) {
			if (x >= CONST.GRID_BASE || x < 0 || y >= CONST.GRID_BASE || y < 0) {
				const cell = gameContext.map.getClampedCell(
					this.x + Math.floor(x / CONST.GRID_BASE),
					this.y + Math.floor(y / CONST.GRID_BASE)
				)
				const offsetX = modulo(x, CONST.GRID_BASE)
				const offsetY = modulo(y, CONST.GRID_BASE)
				return cell.navMap ? cell.navMap.contains(offsetX, offsetY) : false
			}
			return this.navMap ? this.navMap.contains(x, y) : false
		}
	}
}
