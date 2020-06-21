import type { LayoutElementJson } from "../../Layout/LayoutPIXI"

export default (text: string): LayoutElementJson => ({
	name: "speech",
	type: "text",
	layout: {
		width: "100%",
		height: "100%",
		padding: {top: 16, left: 20}
	},
	config: {
		rich: true,
		text,
		style: {
			lineSpacing: 4,
			xAlign: "justify"
		}
	}
})
