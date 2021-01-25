import { BaseElement } from "./BaseElement"
import { Container } from "@pixi/display"

export class RootElement extends BaseElement {
	/** @internal */
	public readonly handle!: Container

	constructor() {
		super(new Container(), "@root")
	}

	protected onUpdate() {
		this.handle.visible = this.enabled
	}

	public set scale(value: number) {
		this.handle.scale.set(value)
	}
}
