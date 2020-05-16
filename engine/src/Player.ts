import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { gameContext } from "./GameContext"
import { Direction } from "./Path"
import { GameMap } from "./GameMap"

export class Player extends Sprite.Character {

	public constructor(walkSequence: Sprite.WalkSequence, speed = CONST.WALK_BASE_SPEED) {
		super(walkSequence, speed)
		this.onUpdate.add(() => {
			if (!this.moving) {
				this.checkInput()
			}
		})
		this.alwaysUpdate = true
	}

	private checkInput() {
		if (gameContext.input.keyboard.ArrowUp) {
			this.walk("up")
		} else if (gameContext.input.keyboard.ArrowDown) {
			this.walk("down")
		} else if (gameContext.input.keyboard.ArrowLeft) {
			this.walk("left")
		} else if (gameContext.input.keyboard.ArrowRight) {
			this.walk("right")
		} else if (gameContext.input.keyboard["+"]) {
			gameContext.camera.zoom *= 1.05
		} else if (gameContext.input.keyboard["-"]) {
			gameContext.camera.zoom *= 0.95
		} else if (gameContext.input.keyboard["0"]) {
			gameContext.camera.zoom = 1
		} else if (gameContext.input.keyboard[" "]) {
			if (this.cell.onUse) {
				this.cell.onUse.invoke(this.cell)
			}
		}
	}

	public walk(direction: Direction) {
		if (this.canWalk(direction)) {
			const next = this.getNeighborCell(direction)
			if (!next.onMove || next.onMove.collect<boolean>((a, b) => a && b, true, next, direction)) {
				const value = super.walk(direction)
				if (value) {
					value.onEnd.add(() => {
						if (next.onCenter) {
							next.onCenter.invoke(next)
						}
						this.checkInput()
					})
				}
				return value
			}
		}
		return null
	}

	protected onCellChange(prev: GameMap.Cell | null) {
		if (this.direction && prev && prev.onExit) {
			prev.onExit.invoke(prev, this.direction)
		}
		if (this.cell) {
			if (this.direction && this.cell.onEnter) {
				this.cell.onEnter.invoke(this.cell, this.direction)
			}
			this.cell.setVisible(this.direction)
		}
	}
}
