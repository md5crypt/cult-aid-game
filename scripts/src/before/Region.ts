class Region {
	private static loadCallbacks: Map<keyof typeof MapId, Types.ScriptStorageMapping["mapLoad"][]> = new Map()

	public static onLoad(map: keyof typeof MapId, callback: Types.ScriptStorageMapping["mapLoad"]) {
		let array = this.loadCallbacks.get(map)
		if (!array) {
			array = []
			this.loadCallbacks.set(map, array)
			scripts.register("mapLoad", "map-" + map, (...arg) => {
				const promises = array!.map(x => x(...arg)).filter(x => x)
				if (promises.length > 0) {
					return Promise.all(promises) as Promise<any>
				} else {
					return
				}
			})
		}
		array.push(callback)
	}

	public static load(map: keyof typeof MapId) {
		return context.map.loadMap("map-" + map)
	}

	public static show() {
		context.map.cells.forEach(cell => cell.visible = true)
	}

	static showCellGroup(cell?: Types.GameMap.Cell) {
		(cell || context.player.cell).group.forEach(x => x.visible = true)
	}
}
