import { GameData } from "./GameData"
import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { Direction } from "./Path"
import { gameContext } from "./GameContext"

export class GameMap {
	private cells: GameMap.Cell[] = []
	private width: number = 0
	private height: number = 0

	constructor() {
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
		for (let i = 0; i < map.bg.length; i++) {
			if (map.bg[i] != 0) {
				cells[i].applyMapData(gameContext.data.sprites[map.bg[i] - 1])
			}
		}
		this.cells = cells
		this.width = map.width
		this.height = map.height
	}

	public update(delta: number, top: number, left: number, bottom: number, right: number) {
		bottom = Math.min(bottom, top + (this.height - 1))
		right = Math.min(right, left + (this.width - 1))
		const items: Sprite.Item[] = []
		for (let row = top; row <= bottom; row++) {
			const offset = (row % this.height) * this.width
			for (let column = left; column <= right; column++) {
				this.cells[offset + (column % this.width)].collect(items)
			}
		}
		for (let i = 0; i < items.length; i++) {
			items[i].update(delta)
		}
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
	}

	public getCell(x: number, y: number) {
		return this.cells[x + (y * this.width)]
	}
}

export namespace GameMap {
	export class Cell {
		public readonly x: number
		public readonly y: number
		private background: Sprite.Background | null = null
		private composite?: Sprite.Background[]
		private items: Sprite.Item[] = []
		private paths?: GameData.PathData
		private visibility: number

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

		public constructor(x: number, y: number) {
			this.x = x
			this.y = y
			this.visibility = 0
		}

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
		}

		public collect(result: Sprite.Item[]) {
			if (this.items.length) {
				for (let i = 0; i < this.items.length; i++) {
					result.push(this.items[i])
				}
			}
		}

		public render(x: number, y: number) {
			if (this.visibility >= 128) {
				if (this.background) {
					this.background.render(x, y)
				}
				if (this.items.length) {
					for (let i = 0; i < this.items.length; i++) {
						this.items[i].render(x, y)
					}
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
					for (let i = 0; i < this.items.length; i++) {
						this.items[i].render(x, y)
					}
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
				let path: number[][] | undefined
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
