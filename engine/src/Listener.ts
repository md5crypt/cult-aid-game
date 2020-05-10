type Callback<T> = T extends Array<any> ? (...args: T) => void : (arg: T) => void

export class Listener<T = void> {
	private list: Callback<T>[] = []

	public add(listener: Callback<T>) {
		this.list.push(listener)
	}

	public remove(listener: Callback<T>) {
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

	public invoke(...args: T extends Array<any> ? T : [T]) {
		for (let i = 0; i < this.list.length; i++) {
			(this.list[i] as Function)(...args)
		}
	}
}
