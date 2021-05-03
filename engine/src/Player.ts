import { Sprite } from "./Sprite"
import { CONST } from "./Constants"
import { gameContext } from "./GameContext"
import { modulo } from "./utils"
import { PathFinder } from "./PathFinder"

export class Player extends Sprite.MovableItem {

	private inputLock: number
	private vector: [number, number]
	private triggerActive: boolean

	public constructor(walkSequence: Sprite.WalkSequence, speed = CONST.WALK_BASE_SPEED) {
		super(walkSequence, speed)
		this.onUpdate.add(() => this.checkInput())
		this.alwaysUpdate = true
		this.inputLock = 0
		this.triggerActive = false
		this.vector = [0, 0]
	}

	public setVector(x: number, y: number) {
		this.vector[0] = x
		this.vector[1] = y
	}

	public updateWalkSequence(dX: number, dY: number) {
		let sprite
		if (dY < 0) {
			sprite = this.walkSequence.up
		} else if (dY > 0) {
			sprite = this.walkSequence.down
		} else if (dX < 0) {
			sprite = this.walkSequence.left
		} else if (dX > 0) {
			sprite = this.walkSequence.right
		} else {
			sprite = this.walkSequence.idle
		}
		this.setTexture(sprite)
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
		if (gameContext.input.keyboard[" "] || gameContext.input.keyboard.e || gameContext.input.keyboard.enter) {
			if (!this.triggerActive) {
				this.triggerActive = true
				gameContext.map.triggerZones()
			}
		} else {
			this.triggerActive = false
		}
		this.setVector(vector[0], vector[1])
	}

	protected onCellChange() {
		if (this._cell) {
			this._cell.visible = true
		}
	}

	public update(delta: number) {
		const offsetX = modulo(this.movementSmoother.tX, CONST.GRID_BASE)
		const offsetY = modulo(this.movementSmoother.tY, CONST.GRID_BASE)
		const cell = gameContext.map.getClampedCell(
			Math.floor(this.movementSmoother.tX / CONST.GRID_BASE),
			Math.floor(this.movementSmoother.tY / CONST.GRID_BASE)
		)
		if (this.vector[0] != 0 || this.vector[1] != 0) {
			this.moving = true
			const scalar = delta * (this.speed / CONST.WALK_SPEED_SCALE)
			for (let queryDelta = Math.ceil(scalar); queryDelta > 0; queryDelta -= 1) {
				const queryResponse = PathFinder.query(
					cell,
					Math.floor(offsetX),
					Math.floor(offsetY),
					this.vector[0] * queryDelta,
					this.vector[1] * queryDelta
				)
				if (queryResponse) {
					const norm = Math.sqrt(queryResponse[0] * queryResponse[0] + queryResponse[1] * queryResponse[1])
					if (norm > scalar + 0.001) {
						const scaledX = queryResponse[0] * scalar / norm
						const scaledY = queryResponse[1] * scalar / norm
						if (cell.isPointTraversable(Math.floor(offsetX + scaledX), Math.floor(offsetY + scaledY))) {
							this.moveBy(scaledX, scaledY)
							break
						}
					} else {
						this.moveBy(queryResponse[0], queryResponse[1])
						break
					}
				}
			}
			this.updateWalkSequence(this.vector[0], this.vector[1])
		} else if (this.moving) {
			if (this.movementSmoother.isMoving) {
				// just keep last state
			} else {
				this.setTexture(this.walkSequence.idle)
				this.moving = false
			}
		}
		super.update(delta)
		if (this._cell && this.path.length == 0) {
			gameContext.map.updateZones(this._cell, offsetX, offsetY)
		}
	}
}
