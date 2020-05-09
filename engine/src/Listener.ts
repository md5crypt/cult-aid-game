export class Listener<T = void> {
	private list: ((arg: T) => void)[] = []

	public add(listener: (arg: T) => void) {
		this.list.push(listener)
	}

	public remove(listener: (arg: T) => void) {
		const i = this.list.indexOf(listener)
		if (i >= 0) {
			this.list.splice(i, 1)
			return true
		}
		return false
	}

	public clear() {
		this.list = []
	}

	public invoke(arg: T) {
		for (let i = 0; i < this.list.length; i++) {
			this.list[i](arg)
		}
	}
}
