export function modulo (a: number, b: number) {
	const r = a % b
	return r >= 0 ? r : b + r
}
