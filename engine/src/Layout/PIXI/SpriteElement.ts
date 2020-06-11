import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { gameContext } from "../../GameContext"

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
		let texture = PIXI.Texture.WHITE
		if (typeof config?.image == "string") {
			texture = (typeof config.image == "string") ? gameContext.textures.ui.getTexture(config.image) : config.image
		}
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
