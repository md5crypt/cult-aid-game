import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { BitmapText, TextOptions, RichText } from "../../Text/BitmapText"

export interface TextElementConfig extends BaseConfig {
	text?: string
	style?: TextOptions
	rich?: boolean
	expand?: "both" | "width" | "height"
}

export class TextElement extends BaseElement {
	public readonly handle!: BitmapText

	private text: string | RichText
	private _offsetNext: number
	private _offsetCurrent: number
	private options: TextOptions
	private textRect: [number, number] | null
	private expand: "both" | "width" | "height"

	public constructor(name?: string, config?: TextElementConfig) {
		super(new BitmapText(), name, config)
		this.textRect = null
		this._offsetNext = 0
		this._offsetCurrent = 0
		this.options = {font: "default"}
		this.text = ""
		this.expand = "both"
		if (config) {
			config.style && (Object.assign(this.options, config.style))
			config.text && (this.text = config.rich ? new RichText(config.text, this.options) : config.text)
			config.expand && (this.expand = config.expand)
		}
	}

	private meausreText() {
		if (typeof this.text == "string") {
			this.textRect = this.handle.measureText(this.text, this.options)
		} else {
			this.textRect = this.text.measure(
				this.config.width ? this.width : (this._width || Infinity),
				this.config.height ? this.height : (this._height || Infinity),
				this._offsetCurrent
			)
		}
	}

	public get contentHeight() {
		if (this.expand == "both" || (this.expand == "height" && this._width)) {
			if (!this.textRect) {
				this.meausreText()
			}
			return this.textRect![1]
		} else {
			return 0
		}
	}

	public get contentWidth() {
		if (this.expand == "both" || (this.expand == "width" && this._height)) {
			if (!this.textRect) {
				this.meausreText()
			}
			return this.textRect![0]
		} else {
			return 0
		}
	}

	protected setDirty() {
		super.setDirty()
		this.textRect = null
	}

	protected onUpdate() {
		super.onUpdate()
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

layoutFactory.register("text", (name, config) => new TextElement(name, config))
