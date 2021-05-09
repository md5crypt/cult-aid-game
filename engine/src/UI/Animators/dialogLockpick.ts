import { BaseElement } from "../../Layout/LayoutPIXI"
import { Animator } from "@md5crypt/animator"

export default () => {
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
