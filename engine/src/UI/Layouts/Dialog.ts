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
			type: "sprite",
			layout: {
				flexGrow: 1,
				flexMode: "horizontal",
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
				},
				{
					type: "container",
					layout: {
						flexMode: "vertical",
						padding: {vertical: 6, right: 12, left: 10},
						height: "100%"
					},
					children: [
						{
							name: "arrow-up",
							type: "sprite",
							config: {
								image: "scroll-arrow-up"
							}
						},
						{
							type: "container",
							layout: {
								flexGrow: 1
							}
						},
						{
							name: "arrow-down",
							type: "sprite",
							config: {
								image: "scroll-arrow-down-active"
							}
						}
					]
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
