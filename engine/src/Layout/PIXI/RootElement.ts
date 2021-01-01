import { BaseElement } from "./BaseElement"

export class RootElement extends BaseElement {
	/** @internal */
	public readonly handle!: PIXI.Container

	constructor() {
		super(new PIXI.Container(), "@root")
	}

	protected onUpdate() {
		this.handle.visible = this.enabled
	}

	public set scale(value: number) {
		this.handle.scale.set(value)
	}
}
