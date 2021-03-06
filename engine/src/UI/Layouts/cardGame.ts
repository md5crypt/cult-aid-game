import type { LayoutElementJson, BaseElement, LayoutConfig } from "../../Layout"
import * as Utils from "./Utils"

function button(name: string, text: string): LayoutElementJson {
	return {
		name,
		type: "container",
		layout: {
			width: "100%",
			flexMode: "vertical",
			flexVerticalAlign: "bottom",
			flexHorizontalAlign: "center",
			margin: { vertical: 1 }
		},
		children: [
			{
				name: "icon",
				type: "sprite",
				layout: {
					margin: { bottom: 2}
				},
				config: {
					image: "card-game-button-" + name
				}
			},
			{
				type: "text-bitmap",
				config: { text }
			}
		]
	}
}

function cardStack(type: string, size: number, marginRight: number, mirrored: boolean): LayoutElementJson {
	return {
		name: "@stack",
		type: "container",
		layout: {
			flexMode: "vertical",
			flexHorizontalAlign: "center",
			margin: {
				right: marginRight
			}
		},
		children: Utils.transform(mirrored, x => x!.reverse(), [
			{
				type: "container",
				layout: {
					width: self => self.getElement("indicator").contentWidth,
					height: self => self.getElement("indicator").contentHeight + (size - 1) * 6
				},
				children: [
					{
						type: "container",
						name: "cards",
						children: Utils.repeat(size, i => ({
							type: "sprite",
							layout: {
								top: mirrored ? i * 6 : ((size - (i + 1)) * 6)
							},
							config: {
								image: "card-game-card-" + type
							}
						}))
					},
					{
						type: "container",
						name: "cards-inactive",
						children: Utils.repeat(size, i => ({
							type: "sprite",
							layout: {
								top: mirrored ? i * 6 : ((size - (i + 1)) * 6)
							},
							config: {
								image: `card-game-card-${type}-inactive`
							}
						}))
					},
					{
						name: "indicator",
						type: "sprite",
						config: {
							image: "card-game-card-" + type,
							interactive: true
						}
					}
				]
			},
			{
				name: "count",
				type: "text-bitmap",
				layout: {
					margin: mirrored ? { bottom: 2 } : { top: 4 }
				},
				config: {
					text: "9/9",
					formatter: (current: number, max: number) => `${current}/${max}`
				}
			}
		])
	}
}

function table(name: string, mirrored: boolean): LayoutElementJson {
	return {
		name,
		type: "container",
		layout: {
			height: 0,
			flexGrow: 1,
			width: "100%",
			flexMode: "horizontal",
			flexHorizontalAlign: "center",
			flexVerticalAlign: mirrored ? "top" : "bottom"
		},
		children: [
			cardStack("khajiit", 3, 6, mirrored),
			cardStack("argonian", 8, 6, mirrored),
			cardStack("dunmer", 3, 12, mirrored),
			cardStack("altmer", 3, 12, mirrored),
			cardStack("bosmer", 3, 6, mirrored),
			cardStack("argonian", 8, 6, mirrored),
			cardStack("khajiit", 3, 0, mirrored)
		]
	}
}

function line(type: "left" | "middle" | "right", layout?: LayoutConfig<BaseElement>): LayoutElementJson {
	return {
		type: "sprite-sliced",
		layout: layout ?? { flexGrow: 1 },
		config: {
			slices: [1, 0, 1, 0],
			image: type == "middle" ? "card-game-line-double" : "card-game-line",
			flipped: type == "right" ? "horizontal" : undefined
		}
	}
}

function gold(side: "top" | "bottom"): LayoutElementJson {
	return {
		name: "gold-" + side,
		type: "text-bitmap",
		layout: {
			width: 50,
			top: self => (self.parent.height >> 1) + (side == "top" ? -18 : 6),
			left: -58
		},
		config: {
			style: { xAlign: "right" },
			formatter: (value: number, delta: number) => delta ? `(${delta > 0 ? "+" : "-"}${delta}) ${value}` : `${value}`,
			text: "(+0) 52"
		}
	}
}

function meat(side: "top" | "bottom"): LayoutElementJson {
	return {
		name: "meat-" + side,
		type: "text-bitmap",
		layout: {
			top: self => (self.parent.height >> 1) + (side == "top" ? -18 : 6),
			left: self => self.parent.outerWidth + 6
		},
		config: {
			formatter: (value: number, delta: number) => delta ? `${value} (${delta > 0 ? "+" : "-"}${delta})` : `${value}`,
			text: "52 (+4)"
		}
	}
}

export default (): LayoutElementJson => ({
	name: "card-game",
	type: "container",
	layout: {
		enabled: false,
		left: Utils.horizontalCenter,
		top: Utils.verticalCenter,
		width: self => Math.min(self.parent.width, 683),
		height: self => Math.min(self.parent.height, 384),
		flexMode: "horizontal",
		flexHorizontalAlign: "center",
		flexVerticalAlign: "middle"
	},
	children: [
		{
			type: "sprite-tiled",
			layout: {
				ignoreLayout: true,
				width: self => self.parent.outerWidth,
				height: self => self.parent.outerHeight
			},
			config: {
				image: "card-game-bg-pattern"
			}
		},
		{
			name: "buttons",
			type: "container",
			layout: {
				width: 90,
				flexMode: "vertical",
				margin: { left: 12 },
				padding: {
					vertical: 6
				}
			},
			children: [
				{
					type: "sprite-sliced",
					layout: {
						ignoreLayout: true,
						width: self => self.parent.width,
						height: self => self.parent.height
					},
					config: {
						image: "card-game-button-container",
						slices: [16, 16, 16, 16]
					}
				},
				button("rules", "Game Rules"),
				button("surrender", "Surrender"),
				button("undo", "Undo Move"),
				button("turn", "End Turn"),
				button("play", "Play Card"),
				button("move", "Move Card")
			]
		},
		{
			type: "container",
			layout: {
				padding: { horizontal: 12, vertical: 4 },
				flexGrow: 1,
				width: 0,
				height: "100%",
				flexMode: "vertical"
			},
			children: [
				table("top", true),
				{
					type: "container",
					layout: {
						width: "100%",
						flexMode: "horizontal",
						flexVerticalAlign: "middle"
					},
					children: [
						line("left", { width: 54 }),
						{
							type: "container",
							layout: {
								width: self => self.children[0].contentWidth,
								height: self => self.children[0].contentHeight
							},
							children: [
								{
									type: "sprite",
									config: {
										image: "card-game-icon-gold"
									}
								},
								gold("top"),
								gold("bottom")
							]
						},
						line("middle"),
						{
							name: "status",
							type: "text-bitmap",
							layout: {
								margin: {
									horizontal: 8
								}
							},
							config: {
								style: {
									xAlign: "center"
								},
								text: "Test text"
							}
						},
						line("middle"),
						{
							type: "container",
							layout: {
								width: self => self.children[0].contentWidth,
								height: self => self.children[0].contentHeight,
								margin: { horizontal: 4 }
							},
							children: [
								{
									type: "sprite",
									config: {
										image: "card-game-icon-meat"
									}
								},
								meat("top"),
								meat("bottom")
							]
						},
						line("right", { width: 54 })
					]
				},
				table("bottom", false)
			]
		}
	]
})
