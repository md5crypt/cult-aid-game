import type { LayoutElementJson, BaseElement } from "../../Layout"

export function wrap(item: LayoutElementJson): LayoutElementJson {
	return {
		type: "container",
		layout: {
			width: "100%",
			height: "100%",
			flexGrow: 1
		},
		children: [item]
	}
}

export function repeat(count: number, callback: (i: number) => LayoutElementJson): LayoutElementJson[] {
	const result: LayoutElementJson[] = []
	for (let i = 0; i < count; i++) {
		result.push(callback(i))
	}
	return result
}

export function filter(children: ("" | false | null | undefined | LayoutElementJson)[]): LayoutElementJson[] {
	return children.filter(x => x) as LayoutElementJson[]
}

export function horizontalCenter<T extends BaseElement>(self: T) {
	return (self.parent.width - self.width) >> 1
}

export function verticalCenter<T extends BaseElement>(self: T) {
	return (self.parent.height - self.height) >> 1
}

export function transform<T>(condition: boolean, f: (value: T) => T, value: T) {
	return condition ? f(value) : value
}

export function background(color?: number, alpha?: number): LayoutElementJson {
	return {
		type: "sprite",
		layout: {
			width: "100%",
			height: "100%",
			ignoreLayout: true
		},
		config: {
			scaling: "stretch",
			tint: color ?? 0xFFFFFF,
			alpha: alpha ?? 1
		}
	}
}
