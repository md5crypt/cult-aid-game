import { DialogUI } from "./DialogUI"
import { CardGameUI } from "./CardGameUI"
import { NewspaperUI } from "./NewspaperUI"
import { InventoryUI } from "./InventoryUI"
import { RootElement } from "../Layout/LayoutPIXI"

export class UI {
	public readonly root: RootElement
	public readonly dialog: DialogUI
	public readonly cardGame: CardGameUI
	public readonly newspaper: NewspaperUI
	public readonly inventory: InventoryUI


	public constructor() {
		this.root = new RootElement()
		this.cardGame = new CardGameUI(this.root)
		this.newspaper = new NewspaperUI(this.root)
		this.inventory = new InventoryUI(this.root)
		this.dialog = new DialogUI(this.root)
	}
}
