import { BaseElement, BaseConfig, layoutFactory, LayoutElementJson } from "./BaseElement"
import { gameContext } from "../../GameContext"

type ScalingType = "none" | "fixed" | "stretch" | "repeat"

export interface SpriteElementConfig extends BaseConfig {
	image?: PIXI.Texture | string
	scaling?: ScalingType
	tint?: number
	alpha?: number
	container?: boolean
}

export interface SpriteElementJson <T extends LayoutElementJson> extends LayoutElementJson {
	type: "sprite"
	config?: SpriteElementConfig
	children?: T[]
}

export class SpriteElement extends BaseElement {
	private sprite: PIXI.Sprite
	private scaling: ScalingType

	constructor(name?: string, config?: SpriteElementConfig) {
		let texture = PIXI.Texture.WHITE
		if (typeof config?.image == "string") {
			texture = (typeof config.image == "string") ? gameContext.textures.ui.getTexture(config.image) : config.image
		}
		const sprite = (config?.scaling == "repeat") ? new PIXI.TilingSprite(texture) : new PIXI.Sprite(texture)
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
		if (config?.alpha === 0) {
			this.sprite.visible = false
		}
	}

	protected onUpdate() {
		super.onUpdate()
		if ((this.scaling == "stretch") || (this.scaling == "repeat")) {
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

	public get contentHeight() {
		return this.sprite.texture.height
	}

	public get contentWidth() {
		return this.sprite.texture.width
	}
}

layoutFactory.register("sprite", (name, config) => new SpriteElement(name, config))
