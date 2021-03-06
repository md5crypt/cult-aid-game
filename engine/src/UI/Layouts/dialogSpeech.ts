import type { LayoutElementJson } from "../../Layout"

export default (text: string): LayoutElementJson => ({
	name: "speech",
	type: "text-bitmap",
	layout: {
		width: "100%",
		height: "100%",
		padding: {top: 19, bottom: 10, left: 20, right: 8}
	},
	config: {
		rich: true,
		text,
		style: {
			lineSpacing: 6,
			xAlign: "justify"
		}
	}
})
