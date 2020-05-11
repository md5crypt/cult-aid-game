import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { gameContext } from "./GameContext"
import { Direction } from "./Path"

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
		}
	}

	public walk(direction: Direction) {
		const value = super.walk(direction)
		if (value) {
			value.onEnd.add(() => this.checkInput())
		}
		return value
	}

	protected onCellChange() {
		if (this.cell) {
			this.cell.setVisible(this.direction)
		}
	}
}
