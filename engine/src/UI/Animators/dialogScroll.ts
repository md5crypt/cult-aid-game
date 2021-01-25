import { BaseElement } from "../../Layout/LayoutPIXI"
import { Animator } from "../Animator"

export default (scroll: BaseElement) => new Animator({
	"slideIn": {
		transition: "opening",
		duration: 250,
		animation: context => scroll.updateConfig({
			margin: {top: context.interpolate(172, 0)},
			width: 48
		})
	},
	"opening": {
		transition: "opened",
		duration: 400,
		animation: context => scroll.updateConfig({
			margin: {top: 0},
			width: context.interpolate(48, scroll.parent.width)
		})
	},
	"opened": {
		transition: context => context.parameters.opened ? false : "closing",
		duration: 0,
		animation: () => scroll.updateConfig({
			width: "100%"
		})
	},
	"closing": {
		transition: () => "slideOut",
		duration: 400,
		animation: context => scroll.updateConfig({
			width: context.interpolate(scroll.parent.width, 48)
		})
	},
	"slideOut": {
		transition: "stop",
		duration: 250,
		animation: context => scroll.updateConfig({
			margin: {top: context.interpolate(0, 172)},
			width: 48
		})
	}
}, {opened: true})
