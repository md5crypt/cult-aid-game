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

class KeyHoldWatcher {
	private timeout: NodeJS.Timeout | null
	private interval: NodeJS.Timeout | null
	private onKeyUp: (key: any) => void

	public constructor(key: string, delay: number, interval: number, callback: () => void) {
		this.interval = null
		this.timeout = setTimeout(() => {
			this.interval = setInterval(callback, interval)
		}, delay)
		this.onKeyUp = gameContext.input.onKeyUp.add(pressed => {
			if (pressed == key) {
				this.destroy()
			}
		})
	}

	public destroy() {
		if (this.timeout) {
			clearTimeout(this.timeout)
			this.timeout = null
		}
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = null
		}
		gameContext.input.onKeyUp.remove(this.onKeyUp)
	}
}

const enum DialogMode {
	NONE,
	SPEECH,
	DIALOG
}

export class DialogUI {
	private root: BaseElement
	private mask: BaseElement
	private animators: ReturnType<typeof animatorsBuilder>
	private activeOption: number
	private listenerTracker: ListenerTracker
	private counter: number
	private ready: boolean
	private keyHoldWatcher?: KeyHoldWatcher
	private releaseQueue: (() => void)[]
	private mode: DialogMode
	private resolveSpeech?: () => void
	private resolveDialog?: (option: number) => void

	constructor(root: BaseElement) {
		this.root = layoutFactory.create(mainLayout(), root)
		this.animators = animatorsBuilder(this.root)
		this.mask = this.root.getElement("body.mask")
		this.activeOption = 0
		this.listenerTracker = new ListenerTracker()
		this.counter = 0
		this.ready = false
		this.releaseQueue = []
		this.mode = DialogMode.NONE
		let lastPosition: PIXI.Point
		let currentOption: number
		let moved = false
		this.mask.on("tap", () => {
			if (moved) {
				return
			}
			if (this.mode == DialogMode.SPEECH) {
				this.speechContinue()
			} else if (this.mode == DialogMode.DIALOG) {
				this.dialogContinue()
			}
		})
		this.mask.on("touchstart", (event: PIXI.InteractionEvent) => {
			console.log("touchstart")
			lastPosition = event.data.getLocalPosition(event.currentTarget).clone()
			currentOption = this.activeOption
			moved = false
		})
		this.mask.on("touchmove", (event: PIXI.InteractionEvent) => {
			const position = event.data.getLocalPosition(event.currentTarget)
			if (Math.abs(position.x - lastPosition.x) > 16 || Math.abs(position.y - lastPosition.y) > 16) {
				moved = true
			}
			if (this.mode != DialogMode.DIALOG) {
				return
			}
			let value = currentOption - Math.floor((event.data.getLocalPosition(event.currentTarget).y - lastPosition.y) / 48)
			value = Math.max(0, Math.min(value, this.mask.getElement("body").children.length - 2))
			if (value != this.activeOption) {
				this.setActive(value)
			}
		})
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
				this.releaseQueue.forEach(x => x())
				this.releaseQueue = []
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

	public ensureClosed() {
		if (this.counter == 0) {
			return Promise.resolve()
		}
		return new Promise(resolve => this.releaseQueue.push(resolve))
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
			return new Promise<void>(resolve => this.releaseQueue.push(resolve))
		}
		return Promise.resolve()
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
		next.getElement<SpriteElement>("lockpick").alpha = 1
		next.getElement<SpriteElement>("keyhole").image = "scroll-keyhole-active"
		this.animators.lockpick.parameters.lockpick = next.getElement<SpriteElement>("lockpick")
		if (!this.animators.lockpick.started) {
			this.animators.lockpick.start()
		}
		this.activeOption = nextIndex
	}

	private speechContinue() {
		const element = this.mask.getElement<TextElement>("speech")
		if (!element.next()) {
			this.mode = DialogMode.NONE
			this.listenerTracker.clear()
			void this.release()
			this.resolveSpeech!()
			this.resolveSpeech = undefined
		}
		gameContext.ui.root.update()
		this.animators.arrowDown.parameters.visible = element.offset != element.length
	}

	public renderSpeech(text: string, avatar?: string) {
		return new Promise<void>(resolve => {
			this.resolveSpeech = resolve
			this.claim()
			this.mode = DialogMode.SPEECH
			this.mask.deleteChildren()
			const element = layoutFactory.create(speechLayout(text), this.mask) as TextElement
			this.setAvatar(avatar)
			this.root.enabled = true
			gameContext.ui.root.update()
			this.animators.arrowUp.parameters.visible = false
			this.animators.arrowDown.parameters.visible = element.offset != element.length
			this.listenerTracker.add(gameContext.input.onKeyDown, key =>
				[" ", "enter", "e"].includes(key) && this.ready && this.speechContinue()
			)
		})
	}

	private setKeyHoldWatcher(key: string, callback: () => void) {
		this.keyHoldWatcher?.destroy()
		this.keyHoldWatcher = new KeyHoldWatcher(key, 300, 100, callback)
	}

	private clearKeyHoldWatcher() {
		this.keyHoldWatcher?.destroy()
		this.keyHoldWatcher = undefined
	}

	private dialogContinue() {
		this.listenerTracker.clear()
		this.clearKeyHoldWatcher()
		this.animators.lockpick.stop()
		void this.release()
		this.resolveDialog!(this.activeOption)
		this.resolveDialog = undefined
	}

	public renderOptions(config: {options: {text: string, seen: boolean}[], prompt?: string, avatar?: string, activeOption: number}) {
		return new Promise<number>(resolve => {
			this.claim()
			this.resolveDialog = resolve
			this.mode = DialogMode.DIALOG
			this.mask.deleteChildren()
			const body = layoutFactory.create(choiceLayout(config.prompt), this.mask)
			config.options.forEach(option => body.insertElement(layoutFactory.create(optionLayout(option.text, option.seen))))
			this.setAvatar(config.avatar)
			this.activeOption = 0
			this.root.enabled = true
			gameContext.ui.root.update()
			this.setActive(config.activeOption)
			this.listenerTracker.add(gameContext.input.onKeyDown, key => {
				if (!this.ready) {
					return
				}
				switch (key) {
					case "arrowUp":
					case "w":
						this.setActive(this.activeOption - 1)
						this.setKeyHoldWatcher(key, () => this.setActive(this.activeOption - 1))
						break
					case "arrowDown":
					case "s":
						this.setActive(this.activeOption + 1)
						this.setKeyHoldWatcher(key, () => this.setActive(this.activeOption + 1))
						break
					case "enter":
					case "e":
						this.dialogContinue()
				}
			})
		})
	}
}
