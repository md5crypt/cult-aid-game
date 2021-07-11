class Region {
	private static loadCallbacks: Map<keyof typeof MapId, Types.ScriptStorageMapping["mapLoad"][]> = new Map()

	public static onLoad<T extends keyof typeof MapId>(map: T, callback: (map: T) => void | Promise<void>) {
		let array = this.loadCallbacks.get(map)
		if (!array) {
			array = []
			this.loadCallbacks.set(map, array)
			scripts.register("mapLoad", map, (...arg) => {
				const promises = array!.map(x => x(...arg)).filter(x => x)
				if (promises.length > 0) {
					return Promise.all(promises) as Promise<any>
				} else {
					return
				}
			})
		}
		array.push(callback as Types.ScriptStorageMapping["mapLoad"])
	}

	public static load(map: keyof typeof MapId) {
		return context.map.loadMap(map)
	}

	public static show() {
		context.map.cells.forEach(cell => cell.visible = true)
	}

	static showCellGroup(cell?: Types.GameMap.Cell) {
		(cell || context.player.cell).group.forEach(x => x.visible = true)
	}
}
