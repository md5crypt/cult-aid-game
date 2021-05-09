import { BaseElement } from "../../Layout"
import { Animator } from "@md5crypt/animator"

export default (arrow: BaseElement, delta: number) => new Animator({
	"opened": {
		transition: context => context.parameters.visible ? false : "closing",
		duration: 0,
		animation: () => arrow.updateConfig({
			margin: {top: 0},
			enabled: true
		})
	},
	"closing": {
		transition: "closed",
		duration: 400,
		animation: context => arrow.updateConfig({
			margin: {top: context.interpolate(0, delta)}
		})
	},
	"closed": {
		transition: context => context.parameters.visible ? "opening" : false,
		duration: 0,
		animation: () => arrow.updateConfig({
			margin: {top: delta},
			enabled: false
		})
	},
	"opening": {
		transition: "opened",
		duration: 400,
		animation: context => arrow.updateConfig({
			margin: {top: context.interpolate(delta, 0)},
			enabled: true
		})
	}
}, {visible: false})
