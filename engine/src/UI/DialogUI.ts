import { gameContext } from "../GameContext"
import { ListenerTracker } from "../Listener"
import { layoutFactory, SpriteElement, TextElement, BaseElement } from "../Layout/LayoutPIXI"

import optionLayout from "./Layouts/dialogOption"
import choiceLayout from "./Layouts/dialogChoice"
import speechLayout from "./Layouts/dialogSpeech"
import mainLayout from "./Layouts/dialog"

import arrowAnimator from "./Animators/dialogArrow"
import avatarAnimator from "./Animators/dialogAvatar"
import lockpickAnimator from "./Animators/dialogLockpick"
import scrollAnimator from "./Animators/dialogScroll"

const animatorsBuilder = (scroll: BaseElement) => ({
	arrowUp: arrowAnimator(scroll.getElement("body.arrow-up"), 34),
	arrowDown: arrowAnimator(scroll.getElement("body.arrow-down"), -34),
	avatar: avatarAnimator(scroll.getElement("avatar")),
	scroll: scrollAnimator(scroll.getElement("body")),
	lockpick: lockpickAnimator()
})

export class DialogUI {
	private root: BaseElement
	private mask: BaseElement
	private animators: ReturnType<typeof animatorsBuilder>
	private activeOption: number
	private listenerTracker: ListenerTracker
	private counter: number
	private ready: boolean

	constructor() {
		this.root = layoutFactory.create(mainLayout(), gameContext.ui.root)
		this.animators = animatorsBuilder(this.root)
		this.mask = this.root.getElement("body.mask")
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
				this.animators.avatar.stop()
				this.root.getElement("avatar").enabled = false
				this.root.getElement("body.arrow-up").enabled = false
				this.root.getElement("body.arrow-down").enabled = false
			} else if (state == "opened") {
				this.ready = true
				this.animators.arrowUp.start("closed")
				this.animators.arrowDown.start("closed")
			} else if (state == "opening") {
				this.animators.avatar.start("closed")
			} else if (state == "closing") {
				this.animators.avatar.parameters.visible = false
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

	private setAvatar(resource: string | undefined) {
		if (resource) {
			this.root.getElement<SpriteElement>("avatar").image = resource
			this.mask.updateConfig({margin: {left: 150}})
			this.animators.avatar.parameters.visible = true
		} else {
			this.mask.updateConfig({margin: {left: 15}})
			this.animators.avatar.parameters.visible = false
		}
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

	public renderSpeech(text: string, avatar?: string, onEnd?: () => void) {
		this.claim()
		this.mask.deleteChildren()
		const element = layoutFactory.create(speechLayout(text), this.mask) as TextElement
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
		const body = layoutFactory.create(choiceLayout(prompt), this.mask)
		options.forEach(option => body.insertElement(layoutFactory.create(optionLayout(option))))
		this.setAvatar(avatar)
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
