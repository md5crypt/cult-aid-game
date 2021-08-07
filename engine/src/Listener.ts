type Callback<T, K = void> = T extends Array<any> ? (...args: T) => K : (arg: T) => K

export class Listener<T = void, K = void> {
	private list: Callback<T>[] = []

	public add(listener: Callback<T, K>) {
		this.list.push(listener)
		return listener
	}

	public promise() {
		return new Promise<T>(resolve => {
			this.list.push(resolve as Callback<T, K>)
		})
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

	public collectBoolean(...args: T extends Array<any> ? T : [T]) {
		let result = false
		for (let i = 0; i < this.list.length; i++) {
			result = result || (this.list[i] as Function)(...args)
		}
		return result
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

export class ListenerTracker {
	private map: Map<Listener<any, any>, Callback<any, any>[]> = new Map()

	public add<T, K>(listener: Listener<T, K>, callback: Callback<T, K>) {
		listener.add(callback)
		const handlers = this.map.get(listener)
		if (handlers) {
			handlers.push(callback)
		} else {
			this.map.set(listener, [callback])
		}
	}

	public clear() {
		for (const [listener, handlers] of this.map.entries()) {
			handlers.forEach(handler => listener.remove(handler))
		}
		this.map.clear()
	}
}

export default Listener
