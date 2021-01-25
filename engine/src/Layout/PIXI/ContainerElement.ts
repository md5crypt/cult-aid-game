import { BaseElement, BaseConfig, layoutFactory, LayoutElementJson } from "./BaseElement"
import { Container } from "@pixi/display"
import { Rectangle } from "@pixi/math"

export interface ContainerElementJson<T extends LayoutElementJson> extends LayoutElementJson {
	type: "container"
	config?: BaseConfig
	children?: T[]
}

export class ContainerElement extends BaseElement {
	/** @internal */
	public readonly handle!: Container

	constructor(name?: string, config?: BaseConfig) {
		super(new Container(), name, config)
	}

	public set interactive(value: boolean) {
		super.interactive = value
		this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
		}
		this.handle.pivot.set(this.width / 2, this.height / 2)
	}
}

layoutFactory.register("container", (name, config) => new ContainerElement(name, config))
