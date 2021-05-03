import { BaseElement, BaseConfig, layoutFactory, LayoutElementJson } from "./BaseElement"
import { gameContext } from "../../GameContext"
import { Colors } from "../../Colors"

import { Texture } from "@pixi/core"
import { Rectangle } from "@pixi/math"
import { Container } from "@pixi/display"
import { Sprite } from "@pixi/sprite"
import { TilingSprite } from "@pixi/sprite-tiling"
import type { Mesh } from "@pixi/mesh"
import { NineSlicePlane } from "@pixi/mesh-extras"

type ScalingType = "none" | "fixed" | "stretch" | "repeat" | "9slice"

export interface SpriteElementConfig extends BaseConfig {
	image?: string
	scaling?: ScalingType
	tint?: number | string
	container?: boolean
	slices?: number[]
	crop?: number[]
}

export interface SpriteElementJson <T extends LayoutElementJson> extends LayoutElementJson {
	type: "sprite"
	config?: SpriteElementConfig
	children?: T[]
}

export class SpriteElement extends BaseElement {
	/** @internal */
	private sprite: Sprite | Mesh
	private scaling: ScalingType

	private static createSprite(config?: SpriteElementConfig) {
		let texture = Texture.WHITE as Texture<any>
		if (typeof config?.image == "string") {
			texture = (typeof config.image == "string") ? gameContext.textures.ui.getTexture(config.image) : config.image
			if (config.crop) {
				texture = new Texture(
					texture.baseTexture,
					new Rectangle(
						texture.frame.x + config.crop[0],
						texture.frame.y + config.crop[1],
						texture.frame.width - config.crop[0] - config.crop[2],
						texture.frame.height - config.crop[1] - config.crop[3]
					),
					new Rectangle(
						0,
						0,
						texture.orig.width - config.crop[0] - config.crop[2],
						texture.orig.height - config.crop[1] - config.crop[3]
					),
					new Rectangle(
						texture.trim.x + config.crop[0],
						texture.trim.y + config.crop[1],
						texture.trim.width - config.crop[0] - config.crop[2],
						texture.trim.height - config.crop[1] - config.crop[3]
					)
				)
			}
		}
		switch (config?.scaling) {
			case "repeat":
				return new TilingSprite(texture)
			case "9slice":
				return new NineSlicePlane(texture, ...(config?.slices ?? []))
			default:
				return new Sprite(texture)
		}
	}

	constructor(name?: string, config?: SpriteElementConfig) {
		const sprite = SpriteElement.createSprite(config)
		let handle: Container = sprite
		if (config?.container) {
			handle = new Container()
			sprite.zIndex = -Infinity
			handle.addChild(sprite)
		}
		super(handle, name, config)
		this.sprite = sprite
		this.scaling = "none"
		if (config) {
			config.tint && (this.sprite.tint = Colors.resolve(config.tint))
			config.scaling && (this.scaling = config.scaling)
		}
	}

	public set image(value: string | null) {
		if(!value) {
			this.sprite.texture = Texture.WHITE
		} else {
			this.sprite.texture = gameContext.textures.ui.getTexture(value)
		}
		this.setDirty()
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle instanceof Sprite) {
			this.handle.anchor.set(0.5, 0.5)
		} else {
			this.handle.pivot.set(this.width / 2, this.height / 2)
		}
		if (this.scaling == "fixed") {
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
		} else if (this.scaling != "none") {
			this.sprite.width = this.width
			this.sprite.height = this.height
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
