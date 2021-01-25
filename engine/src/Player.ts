import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { gameContext } from "./GameContext"
import { Direction } from "./Path"
import { GameMap } from "./GameMap"

export class Player extends Sprite.MovableItem {

	private inputLock: number

	public constructor(walkSequence: Sprite.WalkSequence, speed = CONST.WALK_BASE_SPEED) {
		super(walkSequence, speed)
		this.onUpdate.add(() => this.checkInput())
		this.alwaysUpdate = true
		this.inputLock = 0
	}

	public lockInput() {
		this.inputLock += 1
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
		} else if (gameContext.input.keyboard[" "] || gameContext.input.keyboard.e || gameContext.input.keyboard.enter) {
			if (this.cell.onUse) {
				this.cell.onUse.invoke(this.cell)
				gameContext.map.triggerZones()
			}
		}
		this.setVector(vector[0], vector[1])
	}

	protected onCellChange(prev: GameMap.Cell | null, direction?: Direction) {
		if (direction && prev && prev.onExit) {
			prev.onExit.invoke(prev, direction)
		}
		if (this.cell) {
			if (direction && this.cell.onEnter) {
				this.cell.onEnter.invoke(this.cell, direction)
			}
			this.cell.visible = true
		}
	}

	public update(delta: number) {
		super.update(delta)
		if (this._cell) {
			gameContext.map.updateZones(this._cell, this.offset)
		}
	}
}
