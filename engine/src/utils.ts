export function modulo (a: number, b: number) {
	const r = a % b
	return r >= 0 ? r : b + r
}

export declare class TypedWorker<QUERY, RESPONSE> extends Worker {
	onmessage: ((this: Worker, ev: Omit<MessageEvent, "data"> & {data: RESPONSE}) => any) | null
	postMessage(message: QUERY, transfer: Transferable[]): void
	postMessage(message: QUERY, options?: PostMessageOptions): void
}

export function createWebWorker<QUERY = any, RESPONSE = any>(func: Function) {
	const blob = URL.createObjectURL(new Blob([`(${func})()`], { type: "application/javascript" }))
	const worker = new Worker(blob)
	URL.revokeObjectURL(blob)
	return worker as TypedWorker<QUERY, RESPONSE>
}
