import { LayoutElement, LayoutFactory, LayoutElementJson as BaseLayoutElementJson } from "../LayoutBase"

export const layoutFactory = new LayoutFactory<BaseElement, LayoutElementJson>()

export interface BaseConfig {
	mask?: boolean
	sorted?: boolean
	zIndex?: number
	alpha?: number
}

export type LayoutElementJson = BaseLayoutElementJson<BaseElement>

export abstract class BaseElement extends LayoutElement<BaseElement> {
	/** @internal */
	public readonly handle: PIXI.Container
	private mask?: boolean
	private hidden: boolean

	protected constructor(handle: PIXI.Container, name?: string, config?: BaseConfig) {
		super(name)
		this.handle = handle
		this.hidden = false
		if (config) {
			this.mask = config.mask
			this.handle.zIndex = config.zIndex || 0
			config.sorted && (this.handle.sortableChildren = true)
			config.alpha !== undefined && (this.alpha = config.alpha)
		}
	}

	public set alpha(value: number) {
		this.handle.alpha = value
		this.hidden = (value === 0)
		this.setDirty()
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
		this.handle.visible = this.enabled && !this.hidden
		this.handle.position.set(this.left, this.top)
		if (this.mask) {
			const graphics = new PIXI.Graphics()
			graphics.beginFill(0xFFFFFF)
			graphics.drawRect(0, 0, this.width, this.height)
			graphics.endFill()
			if (this.handle.mask) {
				this.handle.removeChild(this.handle.mask as PIXI.Graphics)
			}
			this.handle.addChild(graphics)
			this.handle.mask = graphics
		}
	}
}
