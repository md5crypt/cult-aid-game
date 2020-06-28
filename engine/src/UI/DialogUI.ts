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
	private counter: number
	private ready: boolean

	constructor() {
		this.root = layoutFactory.create(dialog.layout(), gameContext.ui.root)
		this.animators = dialog.animators(this.root)
		this.mask = this.root.getElement("mask")
		this.activeOption = 0
		this.listenerTracker = new ListenerTracker()
		this.counter = 0
		this.ready = false
		this.animators.scroll.onStateChange.add(state => {
			if (state == null) {
				this.ready = false
				gameContext.player.unlockInput()
				this.root.enabled = false
				this.animators.arrowDown.stop()
				this.animators.arrowUp.stop()
				this.root.getElement("arrow-up").enabled = false
				this.root.getElement("arrow-down").enabled = false
			} else if (state == "opened") {
				this.ready = true
				this.root.getElement("arrow-up").enabled = true
				this.root.getElement("arrow-down").enabled = true
				this.animators.arrowUp.start("closed")
				this.animators.arrowDown.start("closed")
			}
		})
	}

	public claim() {
		this.counter += 1
		if (this.counter == 1) {
			gameContext.player.lockInput()
			this.root.enabled = true
			this.animators.scroll.parameters.opened = true
			this.animators.scroll.start("slideIn")
		}
	}

	public release() {
		this.counter -= 1
		if (this.counter == 0) {
			this.animators.scroll.parameters.opened = false
			this.animators.arrowUp.parameters.visible = false
			this.animators.arrowDown.parameters.visible = false
		}
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
			this.animators.arrowUp.parameters.visible = top < 0
			this.animators.arrowDown.parameters.visible = top > delta
		}
		body.top = top
		current.getElement<SpriteElement>("lockpick").alpha = 0
		current.getElement<SpriteElement>("keyhole").image = "scroll-keyhole"
		current.getElement<TextElement>("text").alpha = 0.75
		next.getElement<SpriteElement>("lockpick").alpha = 1
		next.getElement<SpriteElement>("keyhole").image = "scroll-keyhole-active"
		next.getElement<TextElement>("text").alpha = 1
		this.animators.lockpick.parameters.lockpick = next.getElement<SpriteElement>("lockpick")
		if (!this.animators.lockpick.started) {
			this.animators.lockpick.start()
		}
		this.activeOption = nextIndex
	}

	public renderSpeech(text: string, avatar: AvatarConfig = {}, onEnd?: () => void) {
		this.claim()
		this.mask.deleteChildren()
		const element = layoutFactory.create(dialogSpeech(text), this.mask) as TextElement
		this.setAvatar(avatar)
		this.root.enabled = true
		gameContext.ui.root.update()
		this.animators.arrowUp.parameters.visible = false
		this.animators.arrowDown.parameters.visible = element.offset != element.length
		this.listenerTracker.add(gameContext.input.onKeyDown, (key => {
			const trigger: (typeof key)[] = [" ", "enter", "e"]
			if (trigger.includes(key) && this.ready) {
				if (!element.next() && onEnd) {
					this.listenerTracker.clear()
					this.release()
					onEnd()
				}
				gameContext.ui.root.update()
				this.animators.arrowDown.parameters.visible = element.offset != element.length
			}
		}))
	}

	public renderOptions(options: string[], prompt?: string, avatar?: string, onSelect?: (option: number) => void) {
		this.claim()
		this.mask.deleteChildren()
		const body = layoutFactory.create(dialogChoice(prompt), this.mask)
		options.forEach(option => body.insertElement(layoutFactory.create(dialogOption(option))))
		this.setAvatar({left: avatar})
		this.activeOption = 0
		this.root.enabled = true
		gameContext.ui.root.update()
		this.setActive(0)
		this.listenerTracker.add(gameContext.input.onKeyDown, key => {
			if (!this.ready) {
				return
			}
			switch (key) {
				case "arrowUp":
				case "w":
					this.setActive(this.activeOption - 1)
					break
				case "arrowDown":
				case "s":
					this.setActive(this.activeOption + 1)
					break
				case "enter":
				case "e":
					this.listenerTracker.clear()
					this.animators.lockpick.stop()
					this.release()
					onSelect && onSelect(this.activeOption)
					break
			}
		})
	}
}
