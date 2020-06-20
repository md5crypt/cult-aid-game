import { gameContext } from "../GameContext"
import { layoutFactory, SpriteElement, TextElement, BaseElement } from "../Layout/LayoutPIXI"

import dialogOption from "./Layouts/DialogOption"
import dialog from "./Layouts/Dialog"

export class DialogUI {
	private root: BaseElement
	private body: BaseElement
	private mask: BaseElement
	private avatar: SpriteElement
	private arrowUp: SpriteElement
	private arrowDown: SpriteElement
	private prompt: TextElement
	private activeOption: number
	private handlersAttached: boolean
	private keyDownHandler: (key: string) => void

	constructor() {
		const layout = layoutFactory.create(dialog(), gameContext.ui)
		this.avatar = layout.getElement("avatar")
		this.arrowUp = layout.getElement("arrow-up")
		this.arrowDown = layout.getElement("arrow-down")
		this.mask = layout.getElement("mask")
		this.body = layout.getElement("mask.body")
		this.prompt = layout.getElement("mask.body.prompt")
		this.activeOption = 0
		this.root = layout
		this.handlersAttached = false
		this.keyDownHandler = key => {
			if (key == "ArrowUp") {
				this.setActive(this.activeOption - 1)
			} else if (key == "ArrowDown") {
				this.setActive(this.activeOption + 1)
			}
		}
	}

	public setActive(value: number) {
		const nextIndex = Math.max(0, Math.min(value, this.body.children.length - 2))
		const current = this.body.children[this.activeOption + 1]
		const next = this.body.children[nextIndex + 1]
		if (this.body.heightReady) {
			this.body.top = Math.max(
				Math.min(0, Math.floor((this.mask.height / 2) - (next.top + (next.height / 2)))),
				this.mask.height - this.body.height
			)
		}
		current.getElement<SpriteElement>("lockpick").alpha = 0
		current.getElement<SpriteElement>("keyhole").image = "scroll-keyhole"
		current.getElement<TextElement>("text").alpha = 0.75
		next.getElement<SpriteElement>("lockpick").alpha = 1
		next.getElement<SpriteElement>("keyhole").image = "scroll-keyhole-active"
		next.getElement<TextElement>("text").alpha = 1
		this.activeOption = nextIndex
	}

	public attachHandlers() {
		if (!this.handlersAttached) {
			this.handlersAttached = true
			gameContext.input.onKeyDown.add(this.keyDownHandler)
		}
	}

	public detachHandlers() {
		if (this.handlersAttached) {
			gameContext.input.onKeyDown.remove(this.keyDownHandler)
			this.handlersAttached = false
		}
	}

	public renderOptions(options: string[], prompt?: string) {
		this.body.top = 0
		this.body.deleteChildren(1)
		if (prompt) {
			this.prompt.enabled = true
			this.prompt.setText(prompt, true)
		} else {
			this.prompt.enabled = false
		}
		options.forEach(option => this.body.insertElement(layoutFactory.create(dialogOption(option))))
		this.activeOption = 0
		this.setActive(0)
		this.root.enabled = true
		this.attachHandlers()
	}
}
