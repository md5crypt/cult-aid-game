export class ScriptTimer {

	private data: (readonly [number, () => void])[]
	private timer: number

	constructor() {
		this.data = []
		this.timer = 0
	}

	public wait(amount: number): Promise<void> {
		return new Promise(resolve => {
			this.data.push([this.timer + amount, resolve] as const)
			this.data.sort((a, b) => a[0] - b[0])
		})
	}

	/** @internal */
	public update(delta: number) {
		this.timer += delta
		while (this.data.length && (this.data[0][0] <= this.timer)) {
			this.data.shift()![1]()
		}
	}
}
