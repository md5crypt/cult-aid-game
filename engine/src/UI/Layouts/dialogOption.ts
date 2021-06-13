import type { LayoutElementJson } from "../../Layout"

export default (text: string, seen: boolean): LayoutElementJson => ({
	name: "@option",
	type: "container",
	layout: {
		width: "100%",
		flexMode: "horizontal",
		flexVerticalAlign: "middle",
		margin: {
			vertical: 4
		}
	},
	children: [
		{
			name: "lockpick",
			type: "sprite",
			config: {
				image: "scroll-lockpick",
				alpha: 0
			}
		},
		{
			name: "keyhole",
			type: "sprite",
			layout: {
				margin: {
					left: 4,
					right: 10
				}
			},
			config: {
				image: "scroll-keyhole"
			}
		},
		{
			name: "text",
			type: "text-bitmap",
			layout: {
				flexGrow: 1
			},
			config: {
				alpha: seen ? 0.5 : 1,
				text,
				style: {
					xAlign: "justify",
					lineSpacing: 2,
					color: "black"
				},
				rich: true
			}
		}
	]
})
