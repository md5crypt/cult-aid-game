import * as BezierEasing from "bezier-easing"
import { gameContext } from "../GameContext"
import { Listener } from "../Listener"

const transitions = {
	linear: (x: number) => x,
	easeIn: BezierEasing(0.43, 0, 1, 1),
	/*
	easeInSine: BezierEasing(0.47, 0, 0.74, 0.71),
	easeInQuadratic: BezierEasing(0.55, 0.09, 0.68, 0.53),
	easeInCubic: BezierEasing(0.55, 0.06, 0.68, 0.19),
	easeInQuartic: BezierEasing(.9,.03,.69,.22),
	easeInQuintic: BezierEasing(.76,.05,.86,.06),
	easeInExponential: BezierEasing(.95,.05,.8,.04),
	easeInCircular: BezierEasing(0.6, 0.04, 0.98, 0.34),
	easeInBackward: BezierEasing(0.6, -0.28, 0.74, 0.05),
	*/
	easeOut: BezierEasing(0, 0, 0.58, 1),
	easeInOut: BezierEasing(0.43, 0, 0.58, 1)
} as const

interface State<P> {
	duration: number
	loop?: boolean
	transition?: string | ((context: Animator<P>) => string | false)
	animation: (context: Animator<P>) => void
}

export class Animator<P extends Record<string, any>> {
	private static runningSet: Set<Animator<any>> = new Set()

	private startTime: number
	private states: Record<string, State<P>>
	private state: State<P> | null
	private running: boolean
	private _started: boolean
	private _progress: number
	public readonly parameters: P
	public readonly onStateChange: Listener<[string | null]>

	public constructor(states: Record<string, State<P>>, parameters?: P) {
		if (states.stop) {
			throw new Error("a state can not be called 'stop' as it is a reserved name")
		}
		this.states = states
		this.running = false
		this._started = false
		this._progress = 0
		this.startTime = 0
		this.state = null
		this.onStateChange = new Listener()
		if (parameters) {
			this.parameters = parameters
		} else {
			this.parameters = {} as P
		}
	}

	public get progress() {
		return this._progress
	}

	public get started() {
		return this._started
	}

	public start(initialState = "initial") {
		if (this._started) {
			throw new Error("already running")
		}
		const state = this.states[initialState]
		if (!state) {
			throw new Error(`state initial "${initialState}" not found`)
		}
		this.state = state
		this.running = true
		this._started = true
		this._progress = 0
		this.startTime = gameContext.time
		Animator.runningSet.add(this)
		this.onStateChange.invoke(initialState)
	}

	public stop() {
		if (this._started) {
			Animator.runningSet.delete(this)
			this._started = false
			if (this.state) {
				this.state = null
				this.onStateChange.invoke(null)
			}
		}
	}

	public static update() {
		if (Animator.runningSet.size > 0) {
			const time = gameContext.time
			Animator.runningSet.forEach(x => x.update(time))
		}
	}

	private update(current: number) {
		if (!this._started) {
			throw new Error("not running")
		}
		let state = this.state!
		let progress = state.duration ? (current - this.startTime) / state.duration : 1
		if ((!this.running || (progress > 1)) && state.transition) {
			const nextStateName = typeof state.transition == "string" ? state.transition : state.transition(this)
			if (nextStateName == "stop") {
				this.stop()
				return
			} else if (nextStateName) {
				if (this.running) {
					this.startTime += state.duration
					progress = state.duration ? (current - this.startTime) / state.duration : 1
				} else {
					this.startTime = current
					progress = 0
				}
				state = this.states[nextStateName]
				if (!state) {
					throw new Error(`could not find state ${nextStateName}`)
				}
				this.state = state
				this.onStateChange.invoke(nextStateName)
				// the callback could have called stop()
				if (!this._started) {
					return
				}
				this.running = true
			}
		}
		if (!this.running) {
			return
		}
		if (progress >= 1) {
			if (state.loop) {
				const delta = (current - this.startTime) % state.duration
				this.startTime = current - delta
				progress = delta / state.duration
			} else {
				this.running = false
				progress = 1
			}
		}
		this._progress = progress
		state.animation(this)
	}

	public interpolate(from: number, to: number, func: keyof typeof transitions = "easeInOut") {
		return from + (to - from) * transitions[func](this._progress)
	}

	public steps<T>(steps: {progress: number, value: T}[]) {
		for (let i = steps.length - 1; i >= 0; i -= 1) {
			if (steps[i].progress <= this._progress) {
				return steps[i].value
			}
		}
		return steps[0].value
	}

}
