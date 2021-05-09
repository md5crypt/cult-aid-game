import type { LayoutElementJson } from "../../Layout/LayoutPIXI"

export default (): LayoutElementJson => ({
	name: "inventory",
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
			name: "left",
			type: "sprite",
			config: {
				flipped: "horizontal"
			}
		},
		{
			type: "container",
			layout: {
				flexGrow: 1
			}
		},
		{
			name: "right",
			type: "sprite"
		}
	]
})
