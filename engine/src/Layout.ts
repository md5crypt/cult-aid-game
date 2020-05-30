export interface LayoutConfig {
	readonly anchor: (
		readonly [readonly [number, number], readonly [number, number]] |
		keyof typeof Layout.PRESETS
	)
	readonly name?: string
	readonly top?: number
	readonly bottom?: number
	readonly left?: number
	readonly right?: number
	readonly width?: number
	readonly height?: number
	readonly align?: readonly [number, number]
	readonly create?: (rect: PIXI.Rectangle) => PIXI.Container
	readonly update?: (element: PIXI.Container, rect: PIXI.Rectangle) => void
	readonly children?: readonly LayoutConfig[]
}

function alignValue(value = 0, align = 0) {
	if (align <= 1) {
		return value
	}
	return value - Math.round(value) % align
}

function defaultUpdate(element: PIXI.Container, rect: PIXI.Rectangle) {
	element.position.set(rect.x, rect.y)
	element.width = rect.width
	element.height = rect.height
}

function defaultCreate(rect: PIXI.Rectangle) {
	const container = new PIXI.Container()
	defaultUpdate(container, rect)
	return container
}

export class Layout {
	private config: LayoutConfig
	private map: Map<string, PIXI.Container>
	public readonly root: PIXI.Container

	public static readonly PRESETS = {
		"topLeft": [[0, 0], [0, 0]],
		"topCenter": [[0.5, 0], [0.5, 0]],
		"topRight": [[1, 0], [1, 0]],
		"middleLeft": [[0, 0.5], [0, 0.5]],
		"middleCenter": [[0.5, 0.5], [0.5, 0.5]],
		"middleRight": [[1, 0.5], [1, 0.5]],
		"bottomLeft": [[0, 1], [0, 1]],
		"bottomCenter": [[0.5, 1], [0.5, 1]],
		"bottomRight": [[1, 1], [1, 1]],
		"yStretchLeft": [[0, 0], [0, 1]],
		"yStretchCenter": [[0.5, 0], [0.5, 1]],
		"yStretchRight": [[1, 0], [1, 1]],
		"xStretchTop": [[0, 0], [1, 0]],
		"xStretchMiddle": [[0, 0.5], [1, 0.5]],
		"xStretchBottom": [[0, 1], [1, 1]],
		"stretch": [[0, 0], [1, 1]]
	} as const

	constructor(parent: PIXI.Rectangle, config: LayoutConfig) {
		this.config = config
		this.map = new Map()
		this.root = this.build(parent, config)
	}

	private build(parent: PIXI.Rectangle, config: LayoutConfig, element?: PIXI.Container ) {
		const rect = new PIXI.Rectangle()
		const anchor = (typeof config.anchor == "string") ? Layout.PRESETS[config.anchor] : config.anchor
		const align = config.align || [0, 0] as const
		const pivot = [0, 0]
		if (anchor[0][0] != anchor[1][0]) {
			rect.width = alignValue((
				((anchor[1][0] - anchor[0][0]) * parent.width) -
				(config.left || 0) -
				(config.right || 0)
			), align[0])
		} else {
			pivot[0] = anchor[0][0]
			rect.width = alignValue(config.width, align[0])
		}
		if (anchor[0][1] != anchor[1][1]) {
			rect.height = alignValue((
				((anchor[1][1] - anchor[0][1]) * parent.height) -
				(config.top || 0) -
				(config.bottom || 0)
			), align[1])
		} else {
			pivot[1] = anchor[0][1]
			rect.height = alignValue(config.height, align[1])
		}
		rect.x = (config.left || 0) + (anchor[0][0] * parent.width) - (pivot[0] * rect.width)
		rect.y = (config.top || 0) + (anchor[0][1] * parent.height) - (pivot[1] * rect.height)
		if (element) {
			(config.update || defaultUpdate)(element, rect)
			if (config.children) {
				for (let i = 0; i < config.children.length; i++) {
					this.build(rect, config.children[i], element.children[i] as PIXI.Container)
				}
			}
			return element
		} else {
			const container = (config.create || defaultCreate)(rect)
			if (config.children) {
				for (const child of config.children) {
					container.addChild(this.build(rect, child))
				}
			}
			if (config.name) {
				this.map.set(config.name, container)
			}
			return container
		}
	}

	public update(parent: PIXI.Rectangle) {
		this.build(parent, this.config, this.root)
	}

	public get(name: string) {
		const element = this.map.get(name)
		if (!element) {
			throw new Error(`Layout element '${name}' not found`)
		}
		return element
	}
}
