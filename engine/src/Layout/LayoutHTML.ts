import { LayoutElement, LayoutFactory } from "./LayoutBase"

export const layoutFactory = new LayoutFactory<BaseElement>()

abstract class BaseElement extends LayoutElement<BaseElement> {
	public abstract readonly handle: HTMLDivElement

	protected get contentHeight() {
		return this.handle.clientHeight
	}

	protected get contentWidth() {
		return this.handle.clientWidth
	}

	protected onRemoveElement(index: number) {
		this.handle.removeChild(this.handle.childNodes[index])
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if (index >= this.handle.childNodes.length) {
			this.handle.appendChild(element.handle)
		} else {
			this.handle.insertBefore(element.handle, this.handle.childNodes[index])
		}
	}

	protected onUpdate() {
		this.handle.style.top = this.top + "px"
		this.handle.style.left = this.left + "px"
		this.handle.style.width = this.width + "px"
		this.handle.style.height = this.height + "px"
	}
}

interface DivElementConfig {
	text?: string
	style?: CSSStyleDeclaration
}

export class DivElement extends BaseElement {
	public readonly handle: HTMLDivElement

	public constructor(name?: string, config?: DivElementConfig) {
		super(name)
		this.handle = document.createElement("div")
		this.handle.style.position = "absolute"
		if (config) {
			config.style && Object.assign(this.handle.style, config.style)
			config.text && (this.handle.innerText = config.text)
		}
	}
}

layoutFactory.register("div", (name, config) => new DivElement(name, config))
