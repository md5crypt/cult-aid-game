import type { LayoutElementJson } from "../../Layout"

export default (text?: string): LayoutElementJson => ({
	name: "body",
	type: "container",
	layout: {
		width: "100%",
		flexMode: "vertical",
		margin: {vertical: 4}
	},
	children: [
		{
			name: "prompt",
			type: "text-bitmap",
			layout: {
				enabled: text !== undefined,
				width: "100%",
				margin: {top: 4, bottom: 6}
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
