import { gameContext } from "../GameContext"
import { ListenerTracker } from "../Listener"
import { layoutFactory, SpriteElement, TextElement, BaseElement } from "../Layout/LayoutPIXI"

import dialogOption from "./Layouts/dialogOption"
import dialogChoice from "./Layouts/dialogChoice"
import dialogSpeech from "./Layouts/dialogSpeech"
import * as dialog from "./Layouts/dialog"

interface AvatarConfig {
	left?: string
	right?: string
}

export class DialogUI {
	private root: BaseElement
	private mask: BaseElement
	private animators: ReturnType<typeof dialog.animators>
	private activeOption: number
	private listenerTracker: ListenerTracker

	constructor() {
		this.root = layoutFactory.create(dialog.layout(), gameContext.ui.root)
		this.animators = dialog.animators(this.root)
		this.mask = this.root.getElement("mask")
		this.activeOption = 0
		this.listenerTracker = new ListenerTracker()
	}

	private setAvatar(config: AvatarConfig) {
		const avatarLeft = this.root.getElement<SpriteElement>("avatar-left")
		const avatarRight = this.root.getElement<SpriteElement>("avatar-right")
		const margin = {left: 15, right: 15}
		if (config.left) {
			avatarLeft.enabled = true
			avatarLeft.image = config.left
			margin.left = 150
		} else {
			avatarLeft.enabled = false
		}
		if (config.right) {
			avatarRight.enabled = true
			avatarRight.image = config.right
			margin.right = 150
		} else {
			avatarRight.enabled = false
		}
		this.mask.updateConfig({margin})
	}

	private setActive(value: number) {
		const body = this.mask.getElement("body")
		const nextIndex = Math.max(0, Math.min(value, body.children.length - 2))
		const current = body.children[this.activeOption + 1]
		const next = body.children[nextIndex + 1]
		const position = Math.floor((this.mask.height / 2) - (next.top + (next.outerHeight / 2)))
		const delta = this.mask.height - body.outerHeight
		const top = Math.min(0, Math.max(position, delta))
		if (delta < 0) {
			//this.arrowUpAnimator.parameters.visible = top < 0
			//this.arrowDownAnimator.parameters.visible = top > delta
		}
		body.top = top
		current.getElement<SpriteElement>("lockpick").alpha = 0
		current.getElement<SpriteElement>("keyhole").image = "scroll-keyhole"
		current.getElement<TextElement>("text").alpha = 0.75
		next.getElement<SpriteElement>("lockpick").alpha = 1
		next.getElement<SpriteElement>("keyhole").image = "scroll-keyhole-active"
		next.getElement<TextElement>("text").alpha = 1
		this.activeOption = nextIndex
	}

	public clear() {
		this.listenerTracker.clear()
		this.mask.deleteChildren()
		this.root.enabled = false
	}

	public renderSpeech(text: string, avatar: AvatarConfig = {}, onEnd?: () => void) {
		this.clear()
		const element = layoutFactory.create(dialogSpeech(text), this.mask) as TextElement
		this.setAvatar(avatar)
		this.root.enabled = true
		gameContext.ui.root.update()
		//this.arrowUpAnimator.parameters.visible = false
		//this.arrowDownAnimator.parameters.visible = element.offset != element.length
		this.listenerTracker.add(gameContext.input.onKeyDown, (key => {
			const trigger: (typeof key)[] = [" ", "enter", "e"]
			if (trigger.includes(key)) {
				if (!element.next() && onEnd) {
					onEnd()
				}
				gameContext.ui.root.update()
				//this.arrowDownAnimator.parameters.visible = element.offset != element.length
			}
		}))
	}

	public renderOptions(options: string[], prompt?: string, avatar?: string, onSelect?: (option: number) => void) {
		this.clear()
		const body = layoutFactory.create(dialogChoice(prompt), this.mask)
		options.forEach(option => body.insertElement(layoutFactory.create(dialogOption(option))))
		this.setAvatar({left: avatar})
		this.activeOption = 0
		this.root.enabled = true
		gameContext.ui.root.update()
		this.setActive(0)
		this.listenerTracker.add(gameContext.input.onKeyDown, key => {
			switch (key) {
				case "arrowUp":
					this.setActive(this.activeOption - 1)
					break
				case "arrowDown":
					this.setActive(this.activeOption + 1)
					break
				case "enter":
					onSelect && onSelect(this.activeOption)
					break
			}
		})
		this.animators.scroll.start("slideIn")
	}
}
