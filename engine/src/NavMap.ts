export type NavMapConfig = Record<string, NavMapConfigElement>

interface NavMapConfigElement {
	x: number
	y: number
	width: number
	height: number
	address: number
	junctions: number
}

export const enum NavMapJunctions {
	TOP = 1,
	LEFT = 2,
	BOTTOM = 4,
	RIGHT = 8
}

export class NavMapRect {
	private readonly data: Uint8Array
	private readonly address: number
	public readonly x: number
	public readonly y: number
	public readonly width: number
	public readonly height: number
	public readonly junctions: number

	public constructor(navMapRect: NavMapRect, offset: readonly [number, number])
	public constructor(config: NavMapConfigElement, data: Uint8Array)
	public constructor(arg0: NavMapConfigElement | NavMapRect, arg1: Uint8Array | readonly [number, number]) {
		if (arg0 instanceof NavMapRect) {
			this.data = arg0.data
			this.x = arg0.x + (arg1 as readonly [number, number])[0]
			this.y = arg0.y + (arg1 as readonly [number, number])[1]
			this.address = arg0.address
		} else {
			this.data = arg1 as Uint8Array
			this.x = arg0.x
			this.y = arg0.y
			this.address = arg0.address
		}
		this.width = arg0.width
		this.height = arg0.height
		this.junctions = arg0.junctions
	}

	public get junctionTop() {
		return (this.junctions & NavMapJunctions.TOP) != 0
	}

	public get junctionLeft() {
		return (this.junctions & NavMapJunctions.LEFT) != 0
	}

	public get junctionBottom() {
		return (this.junctions & NavMapJunctions.BOTTOM) != 0
	}

	public get junctionRight() {
		return (this.junctions & NavMapJunctions.RIGHT) != 0
	}

	public contains(x: number, y: number) {
		x -= this.x
		y -= this.y
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			return false
		}
		const index = x + (y * this.width)
		return (this.data[this.address + (index >> 3)] & (1 << (index & 7))) > 0
	}

	public clone(offset: readonly [number, number]) {
		return new NavMapRect(this, offset)
	}
}

export class NavMap {
	private readonly storage: Map<string, NavMapRect>

	public constructor(config: NavMapConfig, data: ArrayBuffer) {
		this.storage = new Map()
		const dataView = new Uint8Array(data)
		for (const key in config) {
			this.storage.set(key, new NavMapRect(config[key], dataView))
		}
	}

	public get(key: string) {
		return this.storage.get(key)
	}

	public getOrThrow(key: string) {
		const result = this.storage.get(key)
		if (!result) {
			throw new Error(`navmap '${key}' not found`)
		}
		return result
	}
}

export default NavMapRect
