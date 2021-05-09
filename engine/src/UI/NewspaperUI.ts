import { layoutFactory, BaseElement } from "../Layout"

import mainLayout from "./Layouts/newspaper"

export class NewspaperUI {
	/** @internal */
	public readonly root: BaseElement

	private resolve?: () => void

	/** @internal */
	public constructor(root: BaseElement) {
		this.root = layoutFactory.create(mainLayout(), root)
		this.root.getElement("button").on("pointertap", () => this.resolve?.())
	}

	public set enabled(value: boolean) {
		this.root.enabled = value
	}

	public get enabled() {
		return this.root.enabled
	}

	public open(dontAutoClose = false) {
		if (this.resolve) {
			throw new Error("already opened")
		}
		return new Promise<void>(resolve => {
			this.resolve = resolve
			this.root.enabled = true
		}).then(() => {
			if (!dontAutoClose) {
				this.root.enabled = false
			}
			this.resolve = undefined
		})
	}
}
