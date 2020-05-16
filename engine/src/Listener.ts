type Callback<T, K = void> = T extends Array<any> ? (...args: T) => K : (arg: T) => K

export class Listener<T = void, K = void> {
	private list: Callback<T>[] = []

	public add(listener: Callback<T, K>) {
		this.list.push(listener)
	}

	public remove(listener: Callback<T, K>) {
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

	public collect<V = K>(
		collector: (accumulator: V, current: K) => V,
		first: V,
		...args: T extends Array<any> ? T : [T]
	): V {
		let result = first
		for (let i = 0; i < this.list.length; i++) {
			result = collector(result, (this.list[i] as Function)(...args))
		}
		return result
	}
}
