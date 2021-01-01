import { DialogUI } from "./DialogUI"
import { CardGameUI } from "./CardGameUI"
import { RootElement } from "../Layout/LayoutPIXI"

export class UI {
	public readonly root: RootElement
	public readonly dialog: DialogUI
	public readonly cardGame: CardGameUI

	public constructor() {
		this.root = new RootElement()
		this.cardGame = new CardGameUI(this.root)
		this.dialog = new DialogUI(this.root)
	}
}
