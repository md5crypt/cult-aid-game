import { BaseElement, BaseConfig, layoutFactory, LayoutElementJson } from "./BaseElement"
import { gameContext } from "../../GameContext"

type ScalingType = "none" | "fixed" | "stretch" | "repeat"

export interface SpriteElementConfig extends BaseConfig {
	image?: string
	scaling?: ScalingType
	tint?: number
	mirror?: "horizontal" | "vertical"
	container?: boolean
}

export interface SpriteElementJson <T extends LayoutElementJson> extends LayoutElementJson {
	type: "sprite"
	config?: SpriteElementConfig
	children?: T[]
}

export class SpriteElement extends BaseElement {
	/** @internal */
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
			config.scaling && (this.scaling = config.scaling)
			if (config.mirror == "horizontal") {
				sprite.scale.x *= -1
				sprite.anchor.x = 1
			} else if (config.mirror == "vertical") {
				sprite.scale.y *= -1
				sprite.anchor.y = 1
			}
		}
	}

	public set image(value: string | null) {
		if(!value) {
			this.sprite.texture = PIXI.Texture.WHITE
		} else {
			this.sprite.texture = gameContext.textures.ui.getTexture(value)
		}
		this.setDirty()
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
