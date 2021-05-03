import { DialogUI } from "./DialogUI"
import { CardGameUI } from "./CardGameUI"
import { NewspaperUI } from "./NewspaperUI"
import { RootElement } from "../Layout/LayoutPIXI"

export class UI {
	public readonly root: RootElement
	public readonly dialog: DialogUI
	public readonly cardGame: CardGameUI
	public readonly newspaper: NewspaperUI

	public constructor() {
		this.root = new RootElement()
		this.cardGame = new CardGameUI(this.root)
		this.newspaper = new NewspaperUI(this.root)
		this.dialog = new DialogUI(this.root)
	}
}
