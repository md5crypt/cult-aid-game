import { GameData } from "./GameData"
import { Sprite } from "./Sprite"
import { GameContext } from "./GameContext"

const enum CONST {
	GRID_BASE = 120
}

export class MapCell {
	private fg: Sprite | null
	private bg: Sprite | null
	private mid: Sprite[]
	private paths: any
	
}

export class GameMap {
	private cells: MapCell[] = []
	private width: number = 0
	private height: number = 0

	constructor() {
	}

	public get xSize() {
		return this.width * CONST.GRID_BASE
	}

	public get ySize() {
		return this.height * CONST.GRID_BASE
	}

	public loadMap(map: GameData.Map) {
		const cells: MapCell[] = new Array(map.width * map.height).fill(null).map(_ => ({fg: null, bg: null, item: []}))
		for (const layer of ["bg", "fg"] as const) {
			if (map[layer]) {
				map[layer].forEach((x, i) => {
					if (x > 0) {
						const sprite = GameContext.data.sprites[x - 1]
						cells[i][layer] = new Sprite.Basic(sprite.layers[layer] as GameData.Texture)
					}
				})
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
		for (let row = top; row <= bottom; row++) {
			const offset = (row % this.height) * this.width
			for (let column = left; column <= right; column++) {
				const cell = this.cells[offset + (column % this.width)]
				const x = column * CONST.GRID_BASE
				const y = row * CONST.GRID_BASE
				if (cell.bg) {
					cell.bg.render(bg, x, y)
				}
				if (cell.item.length) {
					for (let i = 0; i < cell.item.length; i++) {
						cell.item[i].render(mid, x, y)
					}
				}
				if (cell.fg) {
					cell.fg.render(fg, x, y)
				}
			}
		}
	}

	public getCell(x: number, y: number) {
		return this.cells[x + (y * this.width)]
	}

	public addItem(item: Sprite, x: number, y: number) {
	}

	public removeItem(item: Sprite, x: number, y: number) {
	}
}
