import { layoutFactory, BaseElement } from "../Layout/LayoutPIXI"

import mainLayout from "./Layouts/newspaper"

export class NewspaperUI {
	public readonly root: BaseElement
	private resolve?: () => void

	public constructor(root: BaseElement) {
		this.root = layoutFactory.create(mainLayout(), root)
		this.root.getElement("button").on("pointertap", () => this.resolve?.())
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
