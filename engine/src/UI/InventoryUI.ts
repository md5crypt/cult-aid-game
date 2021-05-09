import { layoutFactory, BaseElement, SpriteElement } from "../Layout/LayoutPIXI"

import mainLayout from "./Layouts/inventory"
import inventoryAnimator from "./Animators/inventory"

export class InventoryUI {
	public readonly root: BaseElement

	private leftHand: SpriteElement
	private rightHand: SpriteElement
	private leftHandAnimator: ReturnType<typeof inventoryAnimator>
	private rightHandAnimator: ReturnType<typeof inventoryAnimator>

	public constructor(root: BaseElement) {
		this.root = layoutFactory.create(mainLayout(), root)
		this.leftHand = this.root.getElement("left")
		this.rightHand = this.root.getElement("right")
		this.leftHandAnimator = inventoryAnimator(this.leftHand, -1).start("closed")
		this.rightHandAnimator = inventoryAnimator(this.rightHand, 1).start("closed")
		this.root.enabled = true
	}

	public replaceLeft(value: string | null) {
		this.leftHandAnimator.parameters.replace = value || "item-empty-left"
	}

	public replaceRight(value: string | null) {
		this.rightHandAnimator.parameters.replace = value || "item-empty-right"
	}

	public open(left: string | null, right: string | null) {
		this.leftHand.image = left || "item-empty-left"
		this.rightHand.image = right || "item-empty-right"
		this.leftHandAnimator.parameters.opened = true
		this.rightHandAnimator.parameters.opened = true
	}

	public close() {
		this.leftHandAnimator.parameters.opened = false
		this.rightHandAnimator.parameters.opened = false
	}
}
