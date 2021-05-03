namespace utils {
	export async function reset() {
		const {camera, player, map} = context
		camera.enabled = false
		player.cell.clearItems()
		const point = utils.getPoint(PointId["init-room"])
		player.setMapPosition(...point)
		player.setTexture(player.walkSequence.idle)
		camera.zoom = camera.zoomDefault
		camera.lockOn(player)
		map.cells.forEach(cell => cell.visible = false)
		utils.resolvePosition(point).cell.visible = true
		await context.timer.wait(500)
		player.unlockInput()
		camera.enabled = true
	}

	export async function blackScreen(delay: number) {
		context.camera.enabled = false
		context.ui.root.enabled = false
		await context.timer.wait(delay)
		context.camera.enabled = true
		context.ui.root.enabled = true
	}

	export function executeFragment(fragment: keyof typeof FragmentId) {
		return context.speech.executeFragment(fragment)
	}

	export function executeDialog(dialog: keyof typeof DialogId) {
		return context.speech.executeDialog(dialog)
	}

	export function executeIfUnseen(fragment: keyof typeof FragmentId) {
		if (!storage.dialog.seen[fragment]) {
			return context.speech.executeFragment(fragment)
		}
		return Promise.resolve()
	}

	export function getPoint(point: PointId) {
		return context.map.getObject<"point">(point).position
	}

	export function resolvePosition(point: PointId | readonly [number, number]) {
		const position = Array.isArray(point) ? point : getPoint(point as PointId)
		return context.map.resolvePosition(position[0], position[1])
	}

	export function pathPoint(path: Types.GameData.PathData, index: number) {
		return [
			path.points[index][0] + path.position[0],
			path.points[index][1] + path.position[1]
		]
	}

	export function twoPointPath(from: readonly number[], to: readonly number[]) {
		return [[0, 0], [to[0] - from[0], to[1] - from[1]]] as const
	}
}
