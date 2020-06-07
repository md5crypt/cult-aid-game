import { LayoutFactory } from "../LayoutBase"
import { BaseElement } from "./BaseElement"
import { BitmapText, TextOptions, RichText } from "../../Text/BitmapText"

export interface TextElementConfig {
	text?: string
	options?: TextOptions
	rich?: boolean
}

export class TextElement extends BaseElement {
	public readonly handle: BitmapText

	private text: string | RichText
	private _offsetNext: number
	private _offsetCurrent: number
	private options: TextOptions
	private textRect: [number, number] | null

	public constructor(name?: string, config?: TextElementConfig) {
		super(name)
		this.handle = new BitmapText()
		this.textRect = null
		this._offsetNext = 0
		this._offsetCurrent = 0
		this.options = {font: "default"}
		this.text = ""
		if (config) {
			config.options && (this.options = config.options)
			config.text && (this.text = config.rich ? new RichText(config.text, this.options) : config.text)
		}
	}

	private meausreText() {
		if (typeof this.text == "string") {
			this.textRect = this.handle.measureText(this.text, this.options)
		} else {
			this.textRect = this.text.measure(
				this.config.width ? this.width : Infinity,
				this.config.height ? this.height : Infinity,
				this._offsetCurrent
			)
		}
	}

	protected get contentHeight() {
		if (!this.textRect) {
			this.meausreText()
		}
		return this.textRect![1]
	}

	protected get contentWidth() {
		if (!this.textRect) {
			this.meausreText()
		}
		return this.textRect![0]
	}

	protected setDirty() {
		super.setDirty()
		this.textRect = null
	}

	protected onUpdate() {
		this.handle.position.set(this.top, this.left)
		this.handle.width = this.width
		this.handle.height = this.height
		if (typeof this.text == "string") {
			this.handle.drawText(this.text, this.options)
		} else {
			this._offsetNext = this.handle.drawRichText(this.text, this._offsetCurrent)
		}
	}

	public setText(text: string, rich = false, options?: TextOptions) {
		if (options) {
			this.options = options
		}
		if (rich) {
			this.text = new RichText(text, this.options)
		} else {
			this.text = text
		}
		this.setDirty()
	}

	public set offset(value: number) {
		this._offsetCurrent = value
		this.setDirty()
	}

	public get offset() {
		return this._offsetNext
	}
}

LayoutFactory.register("text", (name, config) => new TextElement(name, config))
