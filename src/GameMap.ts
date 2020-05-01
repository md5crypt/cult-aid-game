import { GameData } from "./GameData"
import { Sprite } from "./Sprite"
import { GameContext } from "./GameContext"
import { CONST } from "./Constants"

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
		const cells: GameMap.Cell[] = new Array(map.width * map.height).fill(null).map(_ => new GameMap.Cell())
		for (let i = 0; i < map.bg.length; i++) {
			if (map.bg[i] != 0) {
				cells[i].applyMapData(GameContext.data.sprites[map.bg[i] - 1])
			}
		}
		this.cells = cells
		this.width = map.width
		this.height = map.height
	}

	public render(top: number, left: number, bottom: number, right: number) {
		const {fg, bg, mid} = GameContext.layers
		bg.clear()
		mid.clear()
		fg.clear()
		const time = GameContext.time
		for (let row = top; row <= bottom; row++) {
			const offset = (row % this.height) * this.width
			for (let column = left; column <= right; column++) {
				const cell = this.cells[offset + (column % this.width)]
				const x = column * CONST.GRID_BASE
				const y = row * CONST.GRID_BASE
				if (cell.bg) {
					cell.bg.render(bg, x, y, time)
				}
				if (cell.mid.length) {
					for (let i = 0; i < cell.mid.length; i++) {
						cell.mid[i].render(mid, x, y, time)
					}
				}
				if (cell.fg) {
					cell.fg.render(fg, x, y, time)
				}
			}
		}
	}

	public getCell(x: number, y: number) {
		return this.cells[x + (y * this.width)]
	}
}

export namespace GameMap {
	export class Cell {
		public fg: Sprite | null = null
		public bg: Sprite | null = null
		public mid: Sprite[] = []
		public paths?: GameData.PathData

		public applyMapData(sprite: GameData.SpriteData) {
			if (sprite.layers.bg) {
				this.bg = new Sprite.Basic(sprite.layers.bg as GameData.Texture)
			}
			if (sprite.layers.fg) {
				this.fg = new Sprite.Basic(sprite.layers.fg as GameData.Texture)
			}
			this.paths = sprite.paths
		}

		public getEnterPath(direction: "up" | "down" | "left" | "right") {
			if (this.paths) {
				return this.paths[direction]
			}
			return undefined
		}

		public getExitPath(direction: "up" | "down" | "left" | "right", x: number, y: number) {
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

		public addItem(item: Sprite) {
			this.mid.push(item)
		}

		public removeItem(item: Sprite) {
			if (this.mid.length == 0) {
				return false
			} else if (this.mid[this.mid.length - 1] == item) {
				this.mid.pop()
				return true
			} else {
				const i = this.mid.indexOf(item)
				if (i >= 0) {
					this.mid.splice(i, 1)
					return true
				}
				return false
			}
		}
	}
}
