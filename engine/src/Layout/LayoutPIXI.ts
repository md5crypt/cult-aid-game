import { ContainerElement, ContainerElementJson } from "./PIXI/ContainerElement"
export { ContainerElement, ContainerElementJson }

import { TextElement, TextElementJson } from "./PIXI/TextElement"
export { TextElement, TextElementJson }

import { SpriteElement, SpriteElementJson } from "./PIXI/SpriteElement"
export { SpriteElement, SpriteElementJson }

import { layoutFactory as layoutFactoryGeneric, BaseElement } from "./PIXI/BaseElement"
import { LayoutFactory } from "./LayoutBase"

export type LayoutElementJson = (
	ContainerElementJson<LayoutElementJson> |
	TextElementJson<LayoutElementJson> |
	SpriteElementJson<LayoutElementJson>
)

export const layoutFactory = layoutFactoryGeneric as LayoutFactory<BaseElement, LayoutElementJson>