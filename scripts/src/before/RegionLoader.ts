class RegionLoader {
	private static callbacks: Map<string, Array<() => void | Promise<void>>> = new Map()

	static register(map: MapId, callback: () => void | Promise<void>) {
		let array = this.callbacks.get(map)
		if (!array) {
			array = []
			this.callbacks.set(map, array)
		}
		array.push(callback)
	}

	static async execute(map: MapId) {
		for (const callback of (this.callbacks.get(map) || [])) {
			const result = callback()
			if (result instanceof Promise) {
				await result
			}
		}
	}
}
