import type { LayoutElementJson } from "../../Layout/LayoutPIXI"

export default (text?: string): LayoutElementJson => ({
	name: "body",
	type: "container",
	layout: {
		width: "100%",
		flexMode: "vertical",
		padding: {vertical: 10}
	},
	children: [
		{
			name: "prompt",
			type: "text",
			layout: {
				enabled: text !== undefined,
				width: "100%",
				margin: {top: 5, bottom: 10}
			},
			config: {
				rich: true,
				text,
				style: {
					lineSpacing: 2,
					xAlign: "center"
				}
			}
		}
	]
})
