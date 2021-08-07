import { MovableItemSprite, WalkSequence } from "./Sprite"
import { CONST } from "./Constants"
import { gameContext } from "./GameContext"

export class Player extends MovableItemSprite {

	private inputLock: number
	private triggerActive: boolean

	public constructor(walkSequence: WalkSequence, speed = CONST.WALK_BASE_SPEED) {
		super(walkSequence, speed)
		this.onUpdate.add(() => this.checkInput())
		this.alwaysUpdate = true
		this.inputLock = 0
		this.triggerActive = false
	}

	public lockInput() {
		this.inputLock += 1
		this.setVector(0, 0)
	}

	public unlockInput() {
		this.inputLock -= 1
		if (this.inputLock < 0) {
			throw new Error("something bad happened")
		}
	}

	private checkInput() {
		if (this.inputLock) {
			return
		}
		let vector = [0, 0]
		if (gameContext.input.keyboard.arrowUp || gameContext.input.keyboard.w) {
			vector = [0, -1]
		} else if (gameContext.input.keyboard.arrowDown || gameContext.input.keyboard.s) {
			vector = [0, 1]
		} else if (gameContext.input.keyboard.arrowLeft || gameContext.input.keyboard.a) {
			vector = [-1, 0]
		} else if (gameContext.input.keyboard.arrowRight || gameContext.input.keyboard.d) {
			vector = [1, 0]
		} else if (gameContext.input.keyboard["+"]) {
			gameContext.camera.zoom *= 1.05
		} else if (gameContext.input.keyboard["-"]) {
			gameContext.camera.zoom *= 0.95
		} else if (gameContext.input.keyboard["0"]) {
			gameContext.camera.zoom = 1
		}
		this.setVector(vector[0], vector[1])
		if (gameContext.input.keyboard[" "] || gameContext.input.keyboard.e || gameContext.input.keyboard.enter) {
			if (!this.triggerActive) {
				this.triggerActive = true
				gameContext.map.triggerZones()
			}
		} else {
			this.triggerActive = false
		}
	}

	protected onCellChange() {
		if (this._cell) {
			this._cell.visible = true
		}
	}

	public update(delta: number) {
		super.update(delta)
		if (this._cell && this.path.length == 0) {
			gameContext.map.updateZones(this._cell, this.offset[0], this.offset[1])
		}
	}
}

export default Player
