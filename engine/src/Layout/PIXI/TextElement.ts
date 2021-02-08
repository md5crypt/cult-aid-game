import { BaseElement, BaseConfig, layoutFactory, LayoutElementJson } from "./BaseElement"
import { BitmapText, RichText } from "../../Text/BitmapText"
import { BitmapTextOptions } from "../../Text/BitmapTextOptions"

export interface TextElementConfig extends BaseConfig {
	text?: string
	style?: BitmapTextOptions
	rich?: boolean
	formatter?: (...args: any) => string
}

export interface TextElementJson <T extends LayoutElementJson> extends LayoutElementJson {
	type: "text"
	config?: TextElementConfig
	children?: T[]
}

export class TextElement extends BaseElement {
	/** @internal */
	public readonly handle!: BitmapText

	private text: string | RichText
	private _offsetNext: number
	private _offsetCurrent: number
	private options: BitmapTextOptions
	private textRect: [number, number] | null
	private formatter?: (...args: any) => string

	public constructor(name?: string, config?: TextElementConfig) {
		super(new BitmapText(), name, config)
		this.textRect = null
		this._offsetNext = 0
		this._offsetCurrent = 0
		this.options = {}
		this.text = ""
		if (config) {
			this.formatter = config.formatter
			config.style && (this.options = config.style)
			config.text && (this.text = config.rich ? new RichText(config.text, this.options) : config.text)
		}
	}

	private meausreText() {
		if (typeof this.text == "string") {
			this.textRect = this.handle.measureText(this.text, this.options)
		} else {
			this.textRect = this.text.measure(
				(this.config.width || this._width) ? this.innerWidth : Infinity,
				(this.config.height || this._height) ? this.innerHeight : Infinity,
				this._offsetCurrent
			)
		}
	}

	public get contentHeight() {
		if (!this.textRect) {
			this.meausreText()
		}
		return this.textRect![1]
	}

	public get contentWidth() {
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
		super.onUpdate()
		this.handle.pivot.set(this.width / 2, this.height / 2)
		this.handle.width = this.innerWidth
		this.handle.height = this.innerHeight
		this.handle.x += this.config.padding.left
		this.handle.y += this.config.padding.top
		if (typeof this.text == "string") {
			this.handle.drawText(this.text, this.options)
		} else {
			this._offsetNext = this.handle.drawRichText(this.text, this._offsetCurrent)
		}
	}

	public setFormattedText(...args: any) {
		if (!this.formatter) {
			throw new Error("formatter not defined")
		}
		this.setText(this.formatter(...args))
	}

	public setText(text: string, rich = false, options?: BitmapTextOptions) {
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

	public get length() {
		return this.text instanceof RichText ? this.text.words.length : 0
	}

	public next() {
		if (this._offsetNext == this.length) {
			return false
		}
		this.offset = this._offsetNext
		return true
	}
}

layoutFactory.register("text", (name, config) => new TextElement(name, config))
