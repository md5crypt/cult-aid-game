import { BaseElement } from "../../Layout"
import { Animator } from "@md5crypt/animator"

export default (avatar: BaseElement) => new Animator({
	"opened": {
		transition: context => context.parameters.visible ? false : "closing",
		duration: 0,
		animation: () => avatar.updateConfig({
			margin: {top: 0},
			enabled: true
		})
	},
	"closing": {
		transition: "closed",
		duration: 400,
		animation: context => avatar.updateConfig({
			margin: {top: context.interpolate(0, avatar.contentHeight)}
		})
	},
	"closed": {
		transition: context => context.parameters.visible && context.parameters.enabled ? "opening" : false,
		duration: 0,
		animation: () => avatar.enabled = false
	},
	"opening": {
		transition: "opened",
		duration: 400,
		animation: context => avatar.updateConfig({
			margin: {top: context.interpolate(avatar.contentHeight, 0)},
			enabled: true
		})
	}
}, {visible: false, enabled: true})
