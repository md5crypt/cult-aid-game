import { LayoutElement, LayoutFactory } from "../LayoutBase"

export const layoutFactory = new LayoutFactory<BaseElement>()

export interface BaseConfig {
	mask?: boolean
	sorted?: boolean
	zIndex?: number
}

export abstract class BaseElement extends LayoutElement<BaseElement> {
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

	public get contentHeight() {
		return this.handle.width
	}

	public get contentWidth() {
		return this.handle.height
	}

	protected onRemoveElement(index: number) {
		this.handle.removeChild(this.children[index].handle)
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if ((index >= (this.children.length - 1)) || this.handle.sortableChildren) {
			this.handle.addChild(element.handle)
		} else {
			const position = this.handle.getChildIndex(this.children[index].handle)
			this.handle.addChildAt(element.handle, position)
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
