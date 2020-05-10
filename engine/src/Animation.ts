import { Listener } from "./Listener"
import { CONST } from "./Constants"

interface StackFrame {
	data: Animation.Defenition
	position: number
	counter: number
}

export class Animation {
	public frame: number
	public readonly onEnd: Listener<Animation>
	public readonly onInvoke: Listener<[Animation, string]>
	private delay: number
	private stack: StackFrame[]
	private timer: number

	constructor(defenition: Animation.Defenition, defaultDelay = CONST.FALLBACK_DELAY) {
		this.delay = defaultDelay
		this.stack = [{data: defenition, position: 0, counter: 0}]
		this.onEnd = new Listener()
		this.onInvoke = new Listener()
		this.frame = 0
		this.timer = 0
	}

	public update(delta: number) {
		const stack = this.stack
		this.timer += Math.min(delta, CONST.MAX_ANIMATION_DELTA)
		if (stack.length == 0) {
			// animation ended
			return
		}
		let cnt = 0
		let frame: StackFrame | undefined = stack[this.stack.length - 1]
		loop: while (frame) {
			if (cnt > CONST.MAX_ANIMATION_STEPS) {
				throw new Error("maximum animation steps exceeded, endless loop?")
			}
			cnt += 1
			if (frame.position >= frame.data.length) {
				frame = stack.pop()
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
						if (delay <= this.timer) {
							this.timer -= delay
							frame.position += 1
						} else {
							this.frame = item[1]
							break loop
						}
						break
					} case "invoke":
						frame.position += 1
						this.onInvoke.invoke(this, item[1])
						// this can be probably be done better but... meh
						// will fix it when it becomes an issue
						break loop
					case "loop":
						if (!item[1] || (item[1] > frame.counter)) {
							frame.counter += 1
							frame.position = 0
						} else {
							frame = stack.pop()
						}
						break
					case "sequence": {
						const len = Math.abs(item[2] - item[1]) + 1
						const delay = (item[3] === undefined ? this.delay : item[3]) * len
						if ((len * delay) <= this.timer) {
							this.timer -= delay
							frame.position += 1
						} else {
							const diff = Math.floor(this.timer / len)
							this.frame = item[2] + ((item[2] > item[1]) ? diff : -diff)
							break loop
						}
						break
					} default:
						throw new Error("corrutped animation: " + JSON.stringify(item))
				}
			} else {
				stack.push({data: item as Animation.Defenition, position: 0, counter: 0})
			}
		}
		if (stack.length == 0) {
			this.onEnd.invoke(this)
		}
	}
}

export namespace Animation {
	type DefenitionObject = Readonly<(
		["delay", number] |
		["frame", number, number?] |
		["sequence", number, number, number?] |
		["invoke", string] |
		["loop", number?] |
		Defenition
	)>
	export interface Defenition extends ReadonlyArray<DefenitionObject> {}
}
