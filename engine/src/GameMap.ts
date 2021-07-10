import { GameData } from "./GameData"
import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { Direction } from "./Path"
import { gameContext } from "./GameContext"
import { ScriptTimer } from "./ScriptTimer"
import { NavMapRect } from "./NavMap"
import { Listener } from "./Listener"
import { modulo } from "./utils"

export class GameMap {
	private _cells: GameMap.Cell[] = []
	private width: number = 0
	private height: number = 0
	private inViewList: Sprite.Item[]
	private activeZoneList: GameMap.Zone[]
	private namedObjects: Map<string, GameData.PathData | GameData.PositionData | Sprite.Item | GameMap.Zone>
	private currentMap?: string

	/** @internal */
	public readonly alwaysActiveList: Set<Sprite.Item>
	/** @internal */
	public frame: number

	private readonly maps: Map<string, GameData.MapData>
	private readonly mapStates: Map<string, number[]>

	public constructor(data: GameData) {
		this.inViewList = []
		this.activeZoneList = []
		this.frame = 1
		this.alwaysActiveList = new Set()
		this.namedObjects = new Map()
		this.maps = new Map()
		this.mapStates = new Map()
		for (const map of data.maps) {
			this.maps.set(map.name, map)
		}
	}

	private saveState() {
		this.mapStates.set(this.currentMap!, this._cells.map(x => x.visibility))
	}

	private restoreState() {
		const state = this.mapStates.get(this.currentMap!)
		if (state) {
			for (let i = 0; i < state.length; i++) {
				this._cells[i].visibility = state[i]
			}
		}
	}

	private reset() {
		this.inViewList = []
		this.activeZoneList = []
		this.frame = 1
		this.alwaysActiveList.clear()
		this.namedObjects.clear()
		this._cells = []
	}

	private setObject(name: string, object: Sprite.Item | GameMap.Zone | GameData.PositionData | GameData.PathData) {
		if (this.namedObjects.has(name)) {
			throw new Error(`const not add ${name} of type ${typeof object}, object already exists with type ${typeof this.namedObjects.get(name)}`)
		}
		this.namedObjects.set(name, object)
	}

	public getObject<T extends "item" | "zone" | "point" | "path">(name: string) {
		const object = this.namedObjects.get(name)
		if (!object) {
			throw new Error(`object ${name} not found`)
		}
		return object as ({
			"item": Sprite.Item
			"zone": GameMap.Zone
			"point": GameData.PositionData
			"path": GameData.PathData
		}[T])
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

	public async loadMap(name: string) {
		if (this.currentMap) {
			this.saveState()
		}
		const map = this.maps.get(name)
		if (!map) {
			throw new Error(`map ${name} not found`)
		}
		this.reset()
		this.currentMap = name
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

		for (const object of map.objects) {
			switch (object.type) {
				case "item":
					const item = Sprite.Item.createFromItemData(object)
					if (object.name) {
						this.setObject(object.name, item)
					}
					break
				case "path":
				case "point":
					this.setObject(object.name, object)
					break
				case "zone":
					const zone = GameMap.Zone.create(object)
					if (object.name) {
						this.setObject(object.name, zone)
					}
					const xStop = Math.floor((object.position[0] + object.dimensions[0]) / CONST.GRID_BASE)
					const yStop = Math.floor((object.position[1] + object.dimensions[1]) / CONST.GRID_BASE)
					for (let y = Math.floor(object.position[1] / CONST.GRID_BASE); y <= yStop; y += 1) {
						for (let x = Math.floor(object.position[0] / CONST.GRID_BASE); x <= xStop; x += 1) {
							this.getCell(x % this.width, y % this.height).addZone(zone)
						}
					}
					break
				default:
					console.error(object)
					throw new Error("invalid map object")
			}
		}
		await gameContext.scripts.resolve("mapLoad", name)?.(name)
		this.restoreState()
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
			const item = this.inViewList[i]
			if (item.paint != frame) {
				item.inView = false
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

	public updateZones(cell: GameMap.Cell, offsetX: number, offsetY: number) {
		const zones = cell.collectZones(offsetX, offsetY)
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

	public resolvePosition(x: number, y: number) {
		return {
			offset: [x % CONST.GRID_BASE, y % CONST.GRID_BASE] as [number, number],
			cell: this.getCell(
				Math.floor(x / CONST.GRID_BASE),
				Math.floor(y / CONST.GRID_BASE)
			)
		}
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

	export abstract class Zone {
		public readonly onEnter: Listener<Zone>
		public readonly onExit: Listener<Zone>
		public readonly onUse: Listener<Zone>
		public enabled: boolean
		public paint: number
		public active: boolean

		public constructor(data: GameData.ZoneData) {
			this.enabled = true
			this.paint = 0
			this.active = false
			this.onEnter = new Listener()
			this.onExit = new Listener()
			this.onUse = new Listener()
			const storage = gameContext.scripts
			storage.resolveAll("zoneEnter", this.onEnter, data.name, data.class)
			storage.resolveAll("zoneExit", this.onExit, data.name, data.class)
			storage.resolveAll("zoneUse", this.onUse, data.name, data.class)
			if (data.enabled !== undefined){
				this.enabled = data.enabled
			}
		}

		public static create(data: GameData.ZoneData) {
			if (data.resource) {
				return new ZoneNavMap(data)
			} else {
				return new ZoneRect(data)
			}
		}

		abstract contains(x: number, y: number): boolean
	}

	class ZoneRect extends Zone {
		private rect: [number, number, number, number]

		public constructor(data: GameData.ZoneData) {
			super(data)
			this.rect = [
				data.position[0],
				data.position[1],
				data.dimensions[0] + data.position[0],
				data.dimensions[1] + data.position[1]
			]
		}

		public contains(x: number, y: number) {
			return (
				x >= this.rect[0] && x < this.rect[2] &&
				y >= this.rect[1] && y < this.rect[3]
			)
		}
	}

	class ZoneNavMap extends Zone {
		private zone: NavMapRect

		public constructor(data: GameData.ZoneData) {
			super(data)
			this.zone = new NavMapRect(gameContext.navMap.getOrThrow(data.resource!), data.position)
		}

		public contains(x: number, y: number) {
			return this.zone.contains(x, y)
		}
	}

	export class Cell {
		public readonly x: number
		public readonly y: number
		public readonly timer: ScriptTimer

		private background: Sprite.Background | null = null

		/** @internal */
		public visibility: number
		private pointCache: [number, number][]
		private navMap?: NavMapRect
		private zones: Zone[]

		private _items: Sprite.Item[] = []

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
			if (sprite.revealed) {
				this.visibility = CellVisibility.FULL
			}
		}

		public addZone(zone: GameMap.Zone) {
			this.zones.push(zone)
		}

		/** @internal */
		public collectZones(offsetX: number, offsetY: number) {
			const activeZones = []
			const x = this.x * CONST.GRID_BASE + Math.floor(offsetX)
			const y = this.y * CONST.GRID_BASE + Math.floor(offsetY)
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
