import type { LayoutElementJson, BaseElement } from "../../Layout/LayoutPIXI"
import { Animator } from "../Animator"
import { gameContext } from "../../GameContext"

export const animators = (scroll: BaseElement) => ({
	arrowUp: arrowAnimator(scroll.getElement("arrow-up"), 34),
	arrowDown: arrowAnimator(scroll.getElement("arrow-down"), -34),
	scroll: scrollAnimator(scroll),
	lockpick: lockpickAnimator()
})

export const layout = (): LayoutElementJson => ({
	name: "scroll",
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
						width: () => Math.min(800, gameContext.ui.root.width),
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
						},
						{
							name: "avatar-left",
							type: "sprite",
							layout: {
								top: element => element.parent.height - element.contentHeight
							}
						},
						{
							name: "avatar-right",
							type: "sprite",
							layout: {
								top: element => element.parent.height - element.contentHeight,
								left: element => element.parent.width - element.contentWidth
							},
							config: {
								mirror: "horizontal"
							}
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
})


function arrowAnimator(arrow: BaseElement, delta: number) {
	return new Animator({
		"opened": {
			transition: context => context.parameters.visible ? false : "closing",
			duration: 0,
			animation: () => arrow.updateConfig({margin: {top: 0}})
		},
		"closing": {
			transition: "closed",
			duration: 400,
			animation: context => arrow.updateConfig({margin: {top: context.interpolate(0, delta)}})
		},
		"closed": {
			transition: context => context.parameters.visible ? "opening" : false,
			duration: 0,
			animation: () => arrow.updateConfig({margin: {top: delta}})
		},
		"opening": {
			transition: "opened",
			duration: 400,
			animation: context => arrow.updateConfig({margin: {top: context.interpolate(delta, 0)}})
		}
	}, {visible: false})
}

function scrollAnimator(scroll: BaseElement) {
	return new Animator({
		"slideIn": {
			transition: "open",
			duration: 500,
			animation: context => scroll.updateConfig({
				margin: {top: context.interpolate(172, 0)},
				width: 48
			})
		},
		"open": {
			transition: "opened",
			duration: 500,
			animation: context => scroll.updateConfig({
				width: context.interpolate(48, Math.min(800, scroll.parent.width - 16))
			})
		},
		"opened": {
			transition: context => context.parameters.opened ? false : "close",
			duration: 0,
			animation: () => scroll.updateConfig({
				width: element => Math.min(800, element.parent.width - 16)
			})
		},
		"close": {
			transition: () => "slideOut",
			duration: 500,
			animation: context => scroll.updateConfig({
				width: context.interpolate(Math.min(800, scroll.parent.width - 16), 48)
			})
		},
		"slideOut": {
			transition: "stop",
			duration: 500,
			animation: context => scroll.updateConfig({
				margin: {top: context.interpolate(0, 172)},
				width: 48
			})
		}
	}, {opened: true})
}

function lockpickAnimator() {
	const stepsY = [
		{progress: 0, value: 0},
		{progress: 0.25, value: 1},
		{progress: 0.5, value: 0},
		{progress: 0.75, value: -1}
	]
	const stepsX = [
		{progress: 0, value: 2},
		{progress: 0.25, value: 1},
		{progress: 0.5, value: 0},
		{progress: 0.75, value: 1}
	]
	return new Animator<{lockpick: BaseElement}>({
		"initial": {
			duration: 500,
			loop: true,
			animation: context => context.parameters.lockpick.updateConfig({
				top: context.steps(stepsY),
				left: context.steps(stepsX)
			})
		}
	})
}
