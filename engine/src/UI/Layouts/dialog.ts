import type { LayoutElementJson } from "../../Layout/LayoutPIXI"

export default (): LayoutElementJson => ({
	name: "scroll",
	type: "container",
	layout: {
		width: element => Math.min(800, element.parent.width - 16),
		left: element => (element.parent.width - element.width) / 2,
		height: "100%"
	},
	children: [
		{
			name: "body",
			type: "container",
			layout: {
				left: element => (element.parent.width - element.width) / 2,
				height: "100%"
			},
			children: [
				{
					type: "container",
					layout: {
						width: "100%",
						height: "100%",
						flexMode: "horizontal",
						padding: {horizontal: 5},
						flexHorizontalAlign: "center",
						flexVerticalAlign: "bottom"
					},
					config: {
						mask: true
					},
					children: [
						{
							type: "container",
							layout: {
								width: element => element.parent.parent.parent.width,
								height: 172
							},
							children: [
								{
									name: "arrow-up",
									type: "sprite",
									layout: {
										enabled: false,
										left: element => element.parent.width - 200,
										top: element => 34 - element.contentHeight
									},
									config: {
										image: "scroll-arrow"
									}
								},
								{
									name: "arrow-down",
									type: "sprite",
									layout: {
										enabled: false,
										left: element => element.parent.width - 240,
										top: element => element.parent.height - 36
									},
									config: {
										image: "scroll-arrow",
										mirror: "vertical"
									}
								},
								{
									type: "sprite",
									layout: {
										width: "100%",
										flexMode: "horizontal",
										padding: {top: 12, bottom: 15, horizontal: 23},
										height: element => element.contentHeight,
										top: element => (element.parent.height - element.contentHeight) / 2
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
								}
							]
						}
					]
				},
				{
					type: "sprite",
					layout: {
						top: element => element.parent.height - element.height
					},
					config: {
						image: "scroll-scroll"
					}
				},
				{
					type: "sprite",
					layout: {
						top: element => element.parent.height - element.height,
						left: element => element.parent.width - element.contentWidth
					},
					config: {
						image: "scroll-scroll",
						mirror: "horizontal"
					}
				}
			]
		},
		{
			name: "avatar",
			type: "sprite",
			layout: {
				enabled: false,
				top: element => element.parent.height - element.contentHeight
			}
		}
	]
})
