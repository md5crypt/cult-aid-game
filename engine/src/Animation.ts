import { Listener } from "./Listener"
import { CONST } from "./Constants"

interface StackFrame {
	data: AnimationDefinition
	position: number
	counter: number
}

type DefenitionObject = Readonly<(
	["delay", number] |
	["frame", number, number?] |
	["sequence", number, number, number?] |
	["invoke", string | (() => boolean | void)] |
	["loop", number?] |
	AnimationDefinition
)>

export interface AnimationDefinition extends ReadonlyArray<DefenitionObject> {}

export class Animation {
	public frame: number
	public readonly onEnd: Listener<Animation>
	public readonly onInvoke: Listener<[Animation, string], boolean | void>
	private stack: StackFrame[]
	private timer: number
	private delay: number

	constructor(defenition: AnimationDefinition, delay = CONST.FALLBACK_DELAY) {
		this.stack = [{data: defenition, position: 0, counter: 0}]
		this.onEnd = new Listener()
		this.onInvoke = new Listener()
		this.frame = 0
		this.timer = 0
		this.delay = delay
	}

	public update(delta: number) {
		const stack = this.stack
		this.timer += Math.min(delta, CONST.MAX_ANIMATION_DELTA)
		if (stack.length == 0) {
			// animation ended
			return
		}
		let cnt = 0
		loop: while (stack.length) {
			const frame = stack[this.stack.length - 1]
			if (cnt > CONST.MAX_ANIMATION_STEPS) {
				throw new Error("maximum animation steps exceeded, endless loop?")
			}
			cnt += 1
			if (frame.position >= frame.data.length) {
				stack.pop()
				continue
			}
			const item = frame.data[frame.position]
			if (typeof item[0] == "string") {
				switch (item[0]) {
					case "delay":
						if (item[1] <= this.timer) {
							this.timer -= item[1]
							frame.position += 1
						} else {
							break loop
						}
						break
					case "frame": {
						const delay = (item[2] === undefined ? this.delay : item[2])
						this.frame = item[1]
						if (delay <= this.timer) {
							this.timer -= delay
							frame.position += 1
						} else {
							break loop
						}
						break
					} case "invoke":
						frame.position += 1
						const shouldBreak = (
							(typeof item[1] == "string" && this.onInvoke.collectBoolean(this, item[1])) ||
							(typeof item[1] == "function" && item[1]())
						)
						if (shouldBreak) {
							break loop
						}
						break
					case "loop":
						if (!item[1] || (item[1] > frame.counter)) {
							frame.counter += 1
							frame.position = 0
						} else {
							stack.pop()
						}
						break
					case "sequence": {
						const len = Math.abs(item[2] - item[1]) + 1
						const delay = item[3] === undefined ? this.delay : item[3]
						if ((len * delay) <= this.timer) {
							this.timer -= len * delay
							frame.position += 1
						} else {
							const diff = Math.floor(this.timer / delay)
							this.frame = item[1] + ((item[2] > item[1]) ? diff : -diff)
							break loop
						}
						break
					} default:
						throw new Error("corrutped animation: " + JSON.stringify(item))
				}
			} else {
				frame.position += 1
				stack.push({data: item as AnimationDefinition, position: 0, counter: 0})
			}
		}
		if (stack.length == 0) {
			this.onEnd.invoke(this)
		}
	}
}

export default Animation
