export type LayoutConfig = Readonly<Partial<InternalLayoutConfig>>

export interface LayoutElementJson {
	type: string
	name?: string
	layout?: LayoutConfig
	config?: Record<string, any>
	children?: LayoutElementJson[]
}

interface InternalLayoutConfig {
	top: number
	left: number
	width: number | ((parent: number) => number)
	height: number | ((parent: number) => number)
	padding: number[]
	margin: number[]
	flexMode: "none" | "horizontal" | "vertical"
	flexHorizontalAlign: "left" | "right" | "center"
	flexVerticalAlign: "top" | "bottom" | "middle"
	flexGrow: number
}

export abstract class LayoutElement {
	public readonly name?: string
	protected readonly config: InternalLayoutConfig
	protected parent: LayoutElement | null
	protected children: LayoutElement[]
	private readonly childrenMap: Map<string, LayoutElement>
	private dirty: boolean
	private _top: number | null
	private _left: number | null
	private _width: number | null
	private _height: number | null

	public constructor(name?: string) {
		this.config = {
			top: 0,
			left: 0,
			width: 0,
			height: 0,
			padding: [0, 0, 0, 0],
			margin: [0, 0, 0, 0],
			flexMode: "none",
			flexHorizontalAlign: "left",
			flexVerticalAlign: "top",
			flexGrow: 0
		}
		this.parent = null
		this._top = null
		this._left = null
		this._width = null
		this._height = null
		this.dirty = true
		this.name = name
		this.children = []
		this.childrenMap = new Map()
	}

	private static expandConfigArray(value: number[]) {
		switch (value.length) {
			case 4: return value.slice(0)
			case 2: return [value[0], value[0], value[1], value[1]]
			case 1: return [value[0], value[0], value[0], value[0]]
			default: throw new Error(`invalid value array given: ${value}`)
		}
	}

	private removeElement(element: LayoutElement) {
		const index = this.children.indexOf(element)
		if (index >= 0) {
			if (element.name) {
				this.childrenMap.delete(element.name)
			}
			this.children.splice(index, 1)
			this.setDirty()
			this.onRemoveElement(index)
			return true
		}
		return false
	}

	protected onRemoveElement(_index: number) {
		// no-op by default
	}

	protected onInsertElement(_element: LayoutElement, _index: number) {
		// no-op by default
	}

	protected onUpdate() {
		// no-op by default
	}

	protected resolveLayout() {
		if (this.config.flexMode == "none") {
			return // nothing to do
		}
		const width = this.width
		const height = this.height
		let growCount = this.children.reduce((value, element) => value + element.config.flexGrow, 0)
		if (this.config.flexMode == "horizontal") {
			let growPool = width - this.children.reduce((value, element) => value + element.outerWidth, 0)
			let xOffset = 0
			if (!growCount && (this.config.flexHorizontalAlign != "left")) {
				xOffset = this.config.flexHorizontalAlign == "center" ? Math.floor(growPool / 2) : growPool
			}
			const growFactor = growCount ? growPool / growCount : 0
			for (const element of this.children) {
				if (this.config.flexVerticalAlign != "top") {
					console.log(height, element)
					const diff = height - element.outerHeight
					element._top = this.config.flexVerticalAlign == "middle" ? Math.floor(diff / 2) : diff
				} else {
					element._top = 0
				}
				if (element.config.flexGrow) {
					const amount = growCount > 1 ? Math.floor(growFactor * element.config.flexGrow) : growPool
					growCount -= 1
					growPool -= amount
					element._width = element.width + amount
				}
				element._left = xOffset
				xOffset += element.outerWidth
			}
		} else {
			let growPool = height - this.children.reduce((value, element) => value + element.outerHeight, 0)
			let yOffset = 0
			if (!growCount && (this.config.flexVerticalAlign != "top")) {
				yOffset = this.config.flexVerticalAlign == "middle" ? Math.floor(growPool / 2) : growPool
			}
			const growFactor = growCount ? growPool / growCount : 0
			for (const element of this.children) {
				if (this.config.flexHorizontalAlign != "left") {
					const diff = width - element.outerWidth
					element._left = this.config.flexHorizontalAlign == "center" ? Math.floor(diff / 2) : diff
				} else {
					element._left = 0
				}
				if (element.config.flexGrow) {
					const amount = growCount > 1 ? Math.floor(growFactor * element.config.flexGrow) : growPool
					growCount -= 1
					growPool -= amount
					element._height = element.height + amount
				}
				element._top = yOffset
				yOffset += element.outerHeight
			}
		}
	}

	protected get contentWidth() {
		return 0
	}

	protected get contentHeight() {
		return 0
	}

	protected setDirty() {
		if (!this.dirty) {
			this._top = null
			this._left = null
			this._width = null
			this._height = null
			this.dirty = true
			if (this.config.flexMode != "none") {
				this.parent?.setDirty()
			}
		}
	}

	public update() {
		if (this.dirty) {
			this.resolveLayout()
		}
		this.children.forEach(element => element.update())
		if (this.dirty) {
			this.dirty = false
			this.onUpdate()
		}
	}

	public get top() {
		return (this._top !== null ? this._top : this.config.top) + this.config.margin[0]
	}

	public get left() {
		return (this._left !== null ? this._left : this.config.left) + this.config.margin[2]
	}

	public get width(): number {
		if (this._width === null) {
			if (typeof this.config.width == "function") {
				this._width = this.config.width(this.parent ? this.parent.width : 0)
			} else if (this.config.width) {
				this._width = this.config.width
			} else {
				if (this.config.flexMode == "none") {
					this._width = this.contentWidth
				} else if (this.config.flexMode == "horizontal") {
					this._width = this.children.reduce((value, element) => value + element.outerWidth, 0)
				} else {
					this._width = this.children.reduce((value, element) => Math.max(value, element.outerWidth), 0)
				}
			}
			this._width += this.config.padding[2] + this.config.padding[3]
		}
		return this._width
	}

	public get outerWidth() {
		return this.width + this.config.margin[2] + this.config.margin[3]
	}

	public get height(): number {
		if (this._height === null) {
			if (typeof this.config.height == "function") {
				this._height = this.config.height(this.parent ? this.parent.height : 0)
			} else if (this.config.height) {
				this._height = this.config.height
			} else {
				if (this.config.flexMode == "none") {
					this._height = this.contentHeight
				} else if (this.config.flexMode == "horizontal") {
					this._height = this.children.reduce((value, element) => Math.max(value, element.outerHeight), 0)
				} else {
					this._height = this.children.reduce((value, element) => value + element.outerHeight, 0)
				}
			}
			this._height += this.config.padding[0] + this.config.padding[1]
		}
		return this._height
	}

	public get outerHeight() {
		return this.height + this.config.margin[0] + this.config.margin[1]
	}

	public updateConfig(config: LayoutConfig) {
		Object.assign(this.config, config)
		if (config.padding) {
			this.config.padding = LayoutElement.expandConfigArray(config.padding)
		}
		if (config.margin) {
			this.config.margin = LayoutElement.expandConfigArray(config.margin)
		}
		this.setDirty()
	}

	public getElement<T extends LayoutElement>(name: string) {
		const path = name.split(".")
		let child: LayoutElement | undefined = this
		for (let i = 0; i < path.length; i++) {
			child = child.childrenMap.get(path[i])
			if (!child) {
				throw new Error(`could not resolve '${this.name}'`)
			}
		}
		return child as T
	}

	public insertElement(element: LayoutElement, before?: LayoutElement | string) {
		if (before) {
			const serachResult = this.children.indexOf(typeof before == "string" ? this.getElement(before) : before)
			const index = serachResult >= 0 ? serachResult : this.children.length
			this.children.splice(index, 0, element)
			this.onInsertElement(element, index)
		} else {
			this.children.push(element)
			this.onInsertElement(element, this.children.length - 1)
		}
		if (element.name) {
			this.childrenMap.set(element.name, element)
		}
		element.parent?.removeElement(element)
		element.parent = this
		this.setDirty()
	}

	public delete() {
		this.parent?.removeElement(this)
		this.parent = null
	}
}

type LayoutConstructor = (name?: string, config?: Record<string, any>) => LayoutElement

export class LayoutFactory {
	private static constructors: Map<string, LayoutConstructor> = new Map()

	public static register(type: string, constructor: LayoutConstructor) {
		LayoutFactory.constructors.set(type, constructor)
	}

	public static createElement(type: string, name?: string, config?: Record<string, any>) {
		const constructor = LayoutFactory.constructors.get(type)
		if (!constructor) {
			throw new Error(`unknown layout type '${type}'`)
		}
		return constructor(name, config)
	}

	public static create(json: LayoutElementJson, parent?: LayoutElement) {
		const root = LayoutFactory.createElement(json.type, json.name, json.config)
		if (json.layout) {
			root.updateConfig(json.layout)
		}
		if (json.children) {
			json.children.forEach(element => LayoutFactory.create(element, root))
		}
		parent?.insertElement(root)
		return root
	}
}
