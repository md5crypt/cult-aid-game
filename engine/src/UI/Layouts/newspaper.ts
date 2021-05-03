import type { LayoutElementJson, BaseElement } from "../../Layout/LayoutPIXI"

export default (): LayoutElementJson => ({
	name: "newspaper",
	type: "container",
	layout: {
		enabled: false,
		width: "100%",
		height: "100%",
		flexMode: "horizontal",
		flexHorizontalAlign: "center",
		flexVerticalAlign: "bottom"
	},
	children: [
		{
			type: "sprite",
			layout: {
				ignoreLayout: true,
				width: "100%",
				height: "100%"
			},
			config: {
				tint: 1,
				alpha: 0.1,
				scaling: "stretch"
			}
		},
		{
			type: "container",
			layout: {
				height: self => self.children[0].outerHeight,
				width: self => self.children[0].outerWidth
			},
			children: [
				{
					type: "sprite",
					config: {
						image: "newspaper"
					},
					layout: {
						margin: {
							bottom: 32
						}
					}
				},
				{
					type: "sprite",
					config: {
						image: "newspaper-hand"
					},
					layout: {
						top: self => self.parent.outerHeight - self.height,
						left: self => self.parent.outerWidth - 67
					}
				},
				{
					type: "sprite",
					name: "button",
					config: {
						interactive: true,
						image: "newspaper-button"
					},
					layout: {
						top: 64,
						left: self => self.parent.outerWidth + 32
					}
				}
			]
		}
	]
})
