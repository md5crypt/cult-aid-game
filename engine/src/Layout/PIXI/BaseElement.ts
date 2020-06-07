import { LayoutElement, LayoutFactory } from "../LayoutBase"

export const layoutFactory = new LayoutFactory<BaseElement>()

export interface BaseConfig {
	mask?: boolean
	sorted?: boolean
	zIndex?: number
}

export abstract class BaseElement extends LayoutElement {
	public readonly handle: PIXI.Container
	private mask?: boolean

	constructor(handle: PIXI.Container, name?: string, config?: BaseConfig) {
		super(name)
		this.handle = handle
		if (config) {
			this.mask = config.mask
			this.handle.zIndex = config.zIndex || 0
			config.sorted && (this.handle.sortableChildren = true)
		}
	}

	protected get contentHeight() {
		return this.handle.width
	}

	protected get contentWidth() {
		return this.handle.height
	}

	protected onRemoveElement(index: number) {
		this.handle.removeChildAt(index)
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if (index >= this.handle.children.length) {
			this.handle.addChild(element.handle)
		} else {
			this.handle.addChildAt(element.handle, index)
		}
	}

	protected onUpdate() {
		this.handle.position.set(this.left, this.top)
		if (this.mask) {
			const graphics = new PIXI.Graphics()
			graphics.beginFill(0xFFFFFF)
			graphics.drawRect(0, 0, this.width, this.height)
			graphics.endFill()
			this.handle.mask = graphics
		}
	}
}
