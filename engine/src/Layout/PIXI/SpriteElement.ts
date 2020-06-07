import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"

export interface SpriteElementConfig extends BaseConfig {
	image?: PIXI.Texture
	scaling?: "none" | "fixed" | "stretch"
	tint?: number
	alpha?: number
	container?: boolean
}

export class SpriteElement extends BaseElement {
	private sprite: PIXI.Sprite
	private scaling: "none" | "fixed" | "stretch"

	constructor(name?: string, config?: SpriteElementConfig) {
		const texture = config?.image || PIXI.Texture.WHITE
		const sprite = new PIXI.Sprite(texture)
		let handle: PIXI.Container = sprite
		if (config?.container) {
			handle = new PIXI.Container()
			sprite.zIndex = -Infinity
			handle.addChild(sprite)
		}
		super(handle, name, config)
		this.sprite = sprite
		this.scaling = "none"
		if (config) {
			config.tint && (this.sprite.tint = config.tint)
			config.alpha && (this.sprite.alpha = config.alpha)
			config.scaling && (this.scaling = config.scaling)
		}
	}

	protected onRemoveElement(index: number) {
		super.onRemoveElement(index + 1)
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if (this.sprite == this.handle) {
			throw new Error("can not add element to a non container SpriteElement")
		}
		super.onInsertElement(element, index + 1)
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.scaling == "stretch") {
			this.sprite.width = this.width
			this.sprite.height = this.height
		} else if (this.scaling == "fixed") {
			const elementWidth = this.width
			const elementHeight = this.height
			const elementRatio = elementWidth / elementHeight
			const textureWidth = this.sprite.texture.width
			const textureHeight = this.sprite.texture.height
			const textureRatio = textureWidth / textureHeight
			if (elementRatio > textureRatio) {
				this.sprite.width = elementWidth
				this.sprite.height = elementWidth / textureRatio
			} else {
				this.sprite.width = elementHeight * textureRatio
				this.sprite.height = elementHeight
			}
		}
	}

	protected get contentHeight() {
		return this.sprite.texture.height
	}

	protected get contentWidth() {
		return this.sprite.texture.width
	}
}

layoutFactory.register("sprite", (name, config) => new SpriteElement(name, config))
