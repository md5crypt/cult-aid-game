
export interface LayoutElementJson<T extends LayoutElement<any>> {
	type: string
	name?: string
	layout?: LayoutConfig<T>
	config?: Record<string, any>
	children?: LayoutElementJson<T>[]
}

interface InternalPositioningBox {
	top: number
	left: number
	bottom: number
	right: number
}

type ConfigCallback<T extends LayoutElement<any>> = (element: LayoutElement<T>) => number

interface InternalLayoutConfig<T extends LayoutElement<any>> {
	top: number | ConfigCallback<T>
	left: number | ConfigCallback<T>
	width: number | ConfigCallback<T>
	height: number | ConfigCallback<T>
	padding: InternalPositioningBox
	margin: InternalPositioningBox
	flexMode: "none" | "horizontal" | "vertical"
	flexHorizontalAlign: "left" | "right" | "center"
	flexVerticalAlign: "top" | "bottom" | "middle"
	flexGrow: number
	ignoreLayout: boolean
}

type PositioningBox = Readonly<(Partial<InternalPositioningBox> & {vertical?: number, horizontal?: number}) | number>

interface LayoutConfigOverride<T extends LayoutElement<any>> {
	padding: PositioningBox
	margin: PositioningBox
	top: number | ConfigCallback<T> | string
	left: number | ConfigCallback<T> | string
	width: number | ConfigCallback<T> | string
	height: number | ConfigCallback<T> | string
}

type LayoutConfig<T extends LayoutElement<any>> =  Readonly<Partial<Omit<InternalLayoutConfig<T>, keyof LayoutConfigOverride<T>> & LayoutConfigOverride<T>>>

export abstract class LayoutElement<T extends LayoutElement<any>> {
	public readonly name?: string
	protected readonly config: InternalLayoutConfig<T>
	protected _parent: T | null
	protected children: T[]
	private readonly childrenMap: Map<string, T>
	private dirty: boolean
	private _top: number | null
	private _left: number | null
	protected _width: number | null
	protected _height: number | null

	public constructor(name?: string) {
		this.config = {
			top: 0,
			left: 0,
			width: 0,
			height: 0,
			padding: {top: 0, left: 0, bottom: 0, right: 0},
			margin: {top: 0, left: 0, bottom: 0, right: 0},
			flexMode: "none",
			flexHorizontalAlign: "left",
			flexVerticalAlign: "top",
			flexGrow: 0,
			ignoreLayout: false
		}
		this._parent = null
		this._top = null
		this._left = null
		this._width = null
		this._height = null
		this.dirty = true
		this.name = name
		this.children = []
		this.childrenMap = new Map()
	}

	private removeElement(element: T) {
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

	private get childrenHeight(): number {
		return this.children.reduce((value, element) => value + (element.config.ignoreLayout ? 0 : element.outerHeight), 0)
	}

	private get childrenWidth(): number {
		return this.children.reduce((value, element) => value + (element.config.ignoreLayout ? 0 : element.outerWidth), 0)
	}

	protected get configTop() {
		const value = this.config.top
		return typeof value == "function" ? value(this) : value
	}

	protected get configLeft() {
		const value = this.config.left
		return typeof value == "function" ? value(this) : value
	}

	protected onRemoveElement(_index: number) {
		// no-op by default
	}

	protected onInsertElement(_element: T, _index: number) {
		// no-op by default
	}

	protected onUpdate() {
		// no-op by default
	}

	protected resolveLayout() {
		if (this.config.flexMode == "none") {
			return // nothing to do
		}
		const width = this.innerWidth
		const height = this.innerHeight
		let growCount = this.children.reduce((value, element) => value + element.config.flexGrow, 0)
		if (this.config.flexMode == "horizontal") {
			let growPool = width - this.childrenWidth
			let xOffset = this.config.padding.left
			if (!growCount && (this.config.flexHorizontalAlign != "left")) {
				xOffset += this.config.flexHorizontalAlign == "center" ? Math.floor(growPool / 2) : growPool
			}
			const growFactor = growCount ? growPool / growCount : 0
			for (const element of this.children) {
				if (element.config.ignoreLayout) {
					continue
				}
				element.dirty = true
				if (element.config.flexGrow) {
					const amount = growCount > 1 ? Math.floor(growFactor * element.config.flexGrow) : growPool
					growCount -= 1
					growPool -= amount
					element._width = element.width + amount
					element._height = null
				}
				element._top = this.config.padding.top + element.configTop
				if (this.config.flexVerticalAlign != "top") {
					const diff = height - element.outerHeight
					element._top += this.config.flexVerticalAlign == "middle" ? Math.floor(diff / 2) : diff
				}
				element._left = xOffset + element.configLeft
				xOffset += element.outerWidth
			}
		} else {
			let growPool = height - this.childrenHeight
			let yOffset = this.config.padding.top
			if (!growCount && (this.config.flexVerticalAlign != "top")) {
				yOffset += this.config.flexVerticalAlign == "middle" ? Math.floor(growPool / 2) : growPool
			}
			const growFactor = growCount ? growPool / growCount : 0
			for (const element of this.children) {
				if (element.config.ignoreLayout) {
					continue
				}
				if (element.config.flexGrow) {
					const amount = growCount > 1 ? Math.floor(growFactor * element.config.flexGrow) : growPool
					growCount -= 1
					growPool -= amount
					element._height = element.height + amount
					element._width = null
				}
				element.dirty = true
				element._left = element.configLeft + this.config.padding.left
				if (this.config.flexHorizontalAlign != "left") {
					const diff = width - element.outerWidth
					element._left += this.config.flexHorizontalAlign == "center" ? Math.floor(diff / 2) : diff
				}
				element._top = yOffset + element.configTop
				yOffset += element.outerHeight
			}
		}
	}

	public get parent() {
		if (!this._parent) {
			throw new Error("layout parent is null!")
		}
		return this._parent
	}

	public get contentWidth() {
		return 0
	}

	public get contentHeight() {
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
				this._parent?.setDirty()
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
		return (this._top !== null ? this._top : this.configTop) + this.config.margin.top
	}

	public get left() {
		return (this._left !== null ? this._left : this.configLeft) + this.config.margin.left
	}

	public get width(): number {
		if (this._width === null) {
			if (typeof this.config.width == "function") {
				this._width = this.config.width(this)
			} else if (this.config.width) {
				this._width = this.config.width
			} else {
				if (this.config.flexMode == "none") {
					this._width = this.contentWidth
				} else if (this.config.flexMode == "horizontal") {
					this._width = this.childrenWidth
				} else {
					this._width = this.children.reduce((value, element) => Math.max(value, (element.config.ignoreLayout ? 0 : element.outerWidth)), 0)
				}
				this._width += this.config.padding.left + this.config.padding.right
			}
		}
		return this._width
	}

	public get outerWidth() {
		return this.width + this.config.margin.left + this.config.margin.right
	}

	public get innerWidth() {
		return this.width - this.config.padding.left - this.config.padding.right
	}

	public get height(): number {
		if (this._height === null) {
			if (typeof this.config.height == "function") {
				this._height = this.config.height(this)
			} else if (this.config.height) {
				this._height = this.config.height
			} else {
				if (this.config.flexMode == "none") {
					this._height = this.contentHeight
				} else if (this.config.flexMode == "horizontal") {
					this._height = this.children.reduce((value, element) => Math.max(value, (element.config.ignoreLayout ? 0 : element.outerHeight)), 0)
				} else {
					this._height = this.childrenHeight
				}
			}
			this._height += this.config.padding.top + this.config.padding.bottom
		}
		return this._height
	}

	public get outerHeight() {
		return this.height + this.config.margin.top + this.config.margin.bottom
	}

	public get innerHeight() {
		return this.height - this.config.padding.top - this.config.padding.bottom
	}

	public updateConfig(config: LayoutConfig<T>) {
		Object.assign(this.config, config)
		for (const key of ["padding", "margin"] as const) {
			if (key in config) {
				const value = config[key]!
				if (typeof value == "number") {
					this.config[key] = {top: value, left: value, bottom: value, right: value}
				} else {
					this.config[key] = {
						top: value.top === undefined ? (value.vertical || 0) : value.top,
						left: value.left === undefined ? (value.horizontal || 0) : value.left,
						bottom: value.bottom === undefined ? (value.vertical || 0) : value.bottom,
						right: value.right === undefined ? (value.horizontal || 0) : value.right
					}
				}
			}
		}
		for (const key of ["width", "height"] as const) {
			if (key in config && typeof config[key] == "string") {
				const match = (config[key] as string).match(/^(\d+)%$/)
				if (!match) {
					throw new Error(`unknown ${key} format: ${config[key]}`)
				}
				const scale = parseInt(match[1], 10) / 100
				this.config[key] = element => (key == "width" ? element.parent.innerWidth : element.parent.innerHeight) * scale
			}
		}
		this.setDirty()
	}

	public getElement<K extends T>(name: string): K {
		const path = name.split(".")
		let child: LayoutElement<any> | undefined = this
		for (let i = 0; i < path.length; i++) {
			child = child.childrenMap.get(path[i])
			if (!child) {
				throw new Error(`could not resolve '${this.name}'`)
			}
		}
		return child as K
	}

	public insertElement(element: T, before?: T | string) {
		if (before) {
			const searchResult = this.children.indexOf(typeof before == "string" ? this.getElement(before) : before)
			const index = searchResult >= 0 ? searchResult : this.children.length
			this.children.splice(index, 0, element)
			this.onInsertElement(element, index)
		} else {
			this.children.push(element)
			this.onInsertElement(element, this.children.length - 1)
		}
		if (element.name) {
			this.childrenMap.set(element.name, element)
		}
		element._parent?.removeElement(element)
		element._parent = this
		this.setDirty()
	}

	public delete() {
		this._parent?.removeElement(this)
		this._parent = null
	}
}

type LayoutConstructor = (name?: string, config?: Record<string, any>) => LayoutElement<any>

export class LayoutFactory<T extends LayoutElement<any>> {
	private constructors: Map<string, LayoutConstructor> = new Map()

	public register(type: string, constructor: LayoutConstructor) {
		this.constructors.set(type, constructor)
	}

	public createElement(type: string, name?: string, config?: Record<string, any>): T {
		const constructor = this.constructors.get(type)
		if (!constructor) {
			throw new Error(`unknown layout type '${type}'`)
		}
		return constructor(name, config) as T
	}

	public create(json: LayoutElementJson<T>, parent?: T): T {
		const root = this.createElement(json.type, json.name, json.config)
		if (json.layout) {
			root.updateConfig(json.layout)
		}
		if (json.children) {
			json.children.forEach(element => this.create(element, root))
		}
		parent?.insertElement(root)
		return root
	}
}
