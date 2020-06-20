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
			name: "avatar",
			type: "sprite",
			layout: {
				ignoreLayout: true,
				top: element => element.parent.height - element.contentHeight
			},
			config: {
				image: "avatar-test",
				zIndex: 2
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
						margin: {left: 150},
						height: "100%"
					},
					config: {
						mask: true
					},
					children: [
						{
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
										width: "100%",
										margin: {top: 5, bottom: 10}
									},
									config: {
										rich: true,
										style: {
											xAlign: "center"
										}
									}
								}
							]
						}
					]
				},
				{
					type: "container",
					layout: {
						flexMode: "vertical",
						padding: {vertical: 10, right: 12, left: 4},
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
				image: "scroll-scroll"
			}
		}
	]
})
