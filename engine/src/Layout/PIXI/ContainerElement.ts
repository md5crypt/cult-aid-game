import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"

export class ContainerElement extends BaseElement {
	public readonly handle!: PIXI.Container

	constructor(name?: string, config?: BaseConfig) {
		super(new PIXI.Container(), name, config)
	}
}

layoutFactory.register("container", (name, config) => new ContainerElement(name, config))
