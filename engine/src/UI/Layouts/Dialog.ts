import type { LayoutElementJson } from "../../Layout/LayoutPIXI"

export default (): LayoutElementJson => ({
	name: "scroll",
	type: "container",
	layout: {
		top: element => element.parent.height - element.height,
		width: "100%",
		flexMode: "horizontal",
		flexHorizontalAlign: "center",
		flexVerticalAlign: "middle",
		enabled: false
	},
	config: {
		sorted: true
	},
	children: [
		{
			name: "avatar-left",
			type: "sprite",
			layout: {
				ignoreLayout: true,
				top: element => element.parent.height - element.contentHeight
			},
			config: {
				zIndex: 2
			}
		},
		{
			name: "avatar-right",
			type: "sprite",
			layout: {
				ignoreLayout: true,
				top: element => element.parent.height - element.contentHeight,
				left: element => element.parent.width - element.contentWidth
			},
			config: {
				zIndex: 2,
				mirror: "horizontal"
			}
		},
		{
			type: "sprite",
			layout: {
				left: 8
			},
			config: {
				image: "scroll-scroll",
				zIndex: 1
			}
		},
		{
			name: "arrow-up",
			type: "sprite",
			layout: {
				ignoreLayout: true,
				left: element => element.parent.width - 120,
				top: element => 28 - element.contentHeight
			},
			config: {
				image: "scroll-arrow-up"
			}
		},
		{
			name: "arrow-down",
			type: "sprite",
			layout: {
				ignoreLayout: true,
				left: element => element.parent.width - 160,
				top: element => element.parent.height - 30
			},
			config: {
				image: "scroll-arrow-down"
			}
		},
		{
			type: "sprite",
			layout: {
				flexGrow: 1,
				flexMode: "horizontal",
				padding: {top: 12, bottom: 15},
				height: element => element.contentHeight
			},
			config: {
				container: true,
				image: "scroll-bg",
				scaling: "repeat"
			},
			children: [
				{
					name: "mask",
					type: "container",
					layout: {
						flexGrow: 1,
						height: "100%"
					},
					config: {
						mask: true
					}
				}
			]
		},
		{
			type: "sprite",
			layout: {
				left: -8
			},
			config: {
				image: "scroll-scroll",
				mirror: "horizontal"
			}
		}
	]
})
