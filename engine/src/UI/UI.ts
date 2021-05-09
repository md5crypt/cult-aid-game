import { DialogUI } from "./DialogUI"
import { CardGameUI } from "./CardGameUI"
import { NewspaperUI } from "./NewspaperUI"
import { InventoryUI } from "./InventoryUI"
import { RootElement, BaseElement } from "../Layout"
import { gameContext } from "../GameContext"
export class UI {
	/** @internal */
	public readonly root: RootElement
	public readonly dialog: DialogUI
	public readonly cardGame: CardGameUI
	public readonly newspaper: NewspaperUI
	public readonly inventory: InventoryUI


	public constructor() {
		BaseElement.assetResolver = (value: string) => gameContext.textures.ui.getTexture(value)
		this.root = new RootElement()
		this.cardGame = new CardGameUI(this.root)
		this.newspaper = new NewspaperUI(this.root)
		this.inventory = new InventoryUI(this.root)
		this.dialog = new DialogUI(this.root)
	}

	public set enabled(value: boolean) {
		this.root.enabled = value
	}

	public get enabled() {
		return this.root.enabled
	}
}
