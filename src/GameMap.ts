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
		const plugs = [
			Sprite.find("maze-plug-up").texture as GameData.Texture,
			Sprite.find("maze-plug-down").texture as GameData.Texture,
			Sprite.find("maze-plug-left").texture as GameData.Texture,
			Sprite.find("maze-plug-right").texture as GameData.Texture
		]
		const cells: GameMap.Cell[] = new Array(map.width * map.height)
			.fill(null)
			.map((_, i) => new GameMap.Cell(i % map.width, Math.floor(i / map.width)))
		for (let i = 0; i < map.bg.length; i++) {
			if (map.bg[i] != 0) {
				cells[i].applyMapData(GameContext.data.sprites[map.bg[i] - 1])
				cells[i].plugs = plugs
			}
		}
		this.cells = cells
		this.width = map.width
		this.height = map.height
	}

	public render(top: number, left: number, bottom: number, right: number) {
		const layers = GameContext.layers
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
		private background: Sprite | null = null
		private items: Sprite[] = []
		private paths?: GameData.PathData
		public plugs?: GameData.Texture[]
		private visibility: number

		get visible() {
			return this.visibility >= 16
		}

		set visible(value: boolean) {
			if (value) {
				this.visibility |= 16
			} else {
				this.visibility &= ~16
			}
		}

		public constructor(x: number, y: number) {
			this.x = x
			this.y = y
			this.visibility = 0
		}

		public showPlug(direction: "up" | "down" | "left" | "right") {
			if (this.paths) {
				switch (direction) {
					case "up":
						this.visibility |= 1
						break
					case "down":
						this.visibility |= 2
						break
					case "left":
						this.visibility |= 4
						break
					case "right":
						this.visibility |= 8
						break
				}
			}
		}

		public applyMapData(sprite: GameData.SpriteData) {
			this.background = Sprite.Background.create(sprite)
			this.paths = sprite.paths
		}

		public render(x: number, y: number) {
			if (this.visibility >= 16) {
				if (this.background) {
					this.background.render(x, y)
				}
				if (this.items.length) {
					for (let i = 0; i < this.items.length; i++) {
						this.items[i].render(x, y)
					}
				}
			} else if ((this.visibility > 0) && this.plugs) {
				const layers = GameContext.layers
				for (let i = 0; i < 4; i++) {
					if (this.visibility & (1 << i)) {
						const texture = this.plugs[i]
						layers.bg.addRect(
							0,
							texture.frame[0],
							texture.frame[1],
							x + texture.offset[0],
							y + texture.offset[1],
							texture.frame[2],
							texture.frame[3]
						)
					}
				}
			}
		}

		public showConnectedPlugs() {
			if (this.paths) {
				const map = GameContext.map
				if (this.paths.down) {
					map.getCell(this.x, (this.y + (map.tileHeight - 1)) % map.tileHeight).showPlug("down")
				}
				if (this.paths.up) {
					map.getCell(this.x, (this.y + 1) % map.tileHeight).showPlug("up")
				}
				if (this.paths.right) {
					map.getCell((this.x + (map.tileWidth - 1)) % map.tileWidth, this.y).showPlug("right")
				}
				if (this.paths.left) {
					map.getCell((this.x + 1) % map.tileWidth, this.y).showPlug("left")
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
			this.items.push(item)
		}

		public removeItem(item: Sprite) {
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
