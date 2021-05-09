import { SpriteElement } from "../../Layout"
import { Animator } from "@md5crypt/animator"

export default (element: SpriteElement, direction: number) => new Animator({
	"closed": {
		setup: () => element.enabled = false,
		transition: context => context.parameters.opened ? "opening" : false
	},
	"opening": {
		setup: context => {
			element.enabled = true
			context.parameters._delta = direction * element.contentWidth
		},
		animation: context => element.left = context.interpolate(context.parameters._delta, 0, "easeIn"),
		duration: 250,
		transition: "opened"
	},
	"opened": {
		transition: context => context.parameters.replace ? "replace" : (context.parameters.opened ? false : "closing")
	},
	"replace": {
		delayBefore: 500,
		delayAfter: 250,
		setup: context => {
			context.parameters._delta = direction * element.contentWidth
		},
		animation: context => element.left = context.interpolate(0, context.parameters._delta, "easeOut"),
		duration: 250,
		transition: context => {
			element.image = context.parameters.replace
			context.parameters.replace = null
			return "opening"
		}
	},
	"closing": {
		setup: context => {
			context.parameters._delta = direction * element.contentWidth
		},
		animation: context => element.left = context.interpolate(0, context.parameters._delta, "easeOut"),
		duration: 250,
		transition: "closed"
	}
}, {opened: false, _delta: 0, replace: null as string | null})
