import { LayoutFactory } from "../LayoutBase"
import { BaseElement } from "./BaseElement"

export class ContainerElement extends BaseElement {
	public readonly handle: PIXI.Container = new PIXI.Container()
	protected onUpdate() {
		this.handle.position.set(this.top, this.left)
	}
}

LayoutFactory.register("container", name => new ContainerElement(name))
