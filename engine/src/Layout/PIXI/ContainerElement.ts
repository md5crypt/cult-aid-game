import { BaseElement, BaseConfig, layoutFactory, LayoutElementJson } from "./BaseElement"

export interface ContainerElementJson<T extends LayoutElementJson> extends LayoutElementJson {
	type: "container"
	config?: BaseConfig
	children?: T[]
}

export class ContainerElement extends BaseElement {
	public readonly handle!: PIXI.Container

	constructor(name?: string, config?: BaseConfig) {
		super(new PIXI.Container(), name, config)
	}
}

layoutFactory.register("container", (name, config) => new ContainerElement(name, config))
