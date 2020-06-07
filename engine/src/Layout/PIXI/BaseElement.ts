import { LayoutElement } from "../LayoutBase"

export abstract class BaseElement extends LayoutElement {
	public abstract readonly handle: PIXI.Container

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
}
