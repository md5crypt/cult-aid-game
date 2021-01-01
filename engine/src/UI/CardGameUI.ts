import { gameContext } from "../GameContext"
import { layoutFactory, SpriteElement, TextElement, BaseElement } from "../Layout/LayoutPIXI"
import * as CardGame from "../MiniGames/CardGame"
import { Colors } from "../Colors"

import mainLayout from "./Layouts/cardGame"

const enum GamePhase {
	IDLE,
	PLAY_CARD,
	MOVE_CARD,
	WAIT,
	VICTORY,
	DEFEAT
}

interface GameState {
	player: CardGame.StateObject
	opponent: CardGame.StateObject
	cardsPlayed: number
	cardsMoved: number
	altmerPlayed: number
}

class GameInstance {
	public state: GameState
	public readonly promise: Promise<boolean>

	private undoStack: GameState[]
	private worker: CardGame.MinMaxWorker
	private depth: number
	private _resolve!: (victory: boolean) => void

	public constructor(depth: number) {
		this.worker = new CardGame.MinMaxWorker()
		this.state = {
			player: CardGame.newState(),
			opponent: CardGame.newState(),
			cardsPlayed: 0,
			cardsMoved: 0,
			altmerPlayed: 0
		}
		this.depth = depth
		this.undoStack = []
		this.state.player.meat = 5
		this.state.opponent.meat = 6
		this.state.player.gold = 4
		this.state.opponent.gold = 5
		this.promise = new Promise(resolve => this._resolve = resolve)
	}

	public pushState() {
		this.undoStack.push(JSON.parse(JSON.stringify(this.state)))
	}

	public popState() {
		this.state = this.undoStack.pop()!
	}

	public get undoStackSize() {
		return this.undoStack.length
	}

	public endTurn() {
		this.undoStack = []
		this.state = {
			player: this.state.player,
			opponent: CardGame.updateState(this.state.opponent, this.state.player),
			altmerPlayed: 0,
			cardsMoved: 0,
			cardsPlayed: 0
		}
	}

	public queryAI() {
		return this.worker.query(this.state.opponent, this.state.player, this.depth).then(state => {
			this.state.opponent = state
			this.state.player = CardGame.updateState(this.state.player, this.state.opponent)
			return this.state
		})
	}

	public resolve(victory: boolean) {
		this.worker.destroy()
		this._resolve(victory)
	}
}

export class CardGameUI {
	public readonly root: BaseElement

	private _phase: GamePhase

	private instance?: GameInstance

	public constructor(root: BaseElement) {
		([
			["card-altmer", 0x584900],
			["card-dunmer", 0x56003d],
			["card-bosmer", 0x1c3611],
			["card-khajiit", 0x650000],
			["card-argonian", 0x000065]
		] as const).map(x => Colors.register(x[0], x[1]))
		this.root = layoutFactory.create(mainLayout(), root)
		this.initStack("top")
		this.initStack("bottom")
		this.root.getElement("buttons.rules").on("pointertap", () => {
			this.root.interactiveChildren = false
			void gameContext.speech.executeDialog("card-game-rules", "card-game-rules-intro").then(() => {
				this.root.interactiveChildren = true
			})
		})
		this.root.getElement("buttons.surrender").on("pointertap", () => this.phase = GamePhase.DEFEAT)
		this.root.getElement("buttons.play").on("pointertap", () => this.phase = GamePhase.PLAY_CARD)
		this.root.getElement("buttons.move").on("pointertap", () => this.phase = GamePhase.MOVE_CARD)
		this.root.getElement("buttons.undo").on("pointertap", () => {
			if (!this.instance) {
				throw new Error()
			}
			if (this.phase == GamePhase.IDLE) {
				this.instance.popState()
			}
			this.phase = GamePhase.IDLE
		})
		this.root.getElement("buttons.turn").on("pointertap", () => {
			if (!this.instance) {
				throw new Error()
			}
			this.instance.endTurn()
			if (this.instance.state.opponent.altmer == 3) {
				this.phase = GamePhase.DEFEAT
			} else {
				this.phase = GamePhase.WAIT
				this.instance.queryAI().then(state => {
					this.phase = (state.player.altmer == 3) ? GamePhase.VICTORY : GamePhase.IDLE
				}).catch(error => {throw error})
			}
		})
		this._phase = GamePhase.IDLE
	}

	public startGame(depth: number) {
		this.instance = new GameInstance(depth)
		this.phase = GamePhase.IDLE
		return this.instance.promise
	}

	public set enabled(value: boolean) {
		this.root.enabled = value
	}

	public set interactive(value: boolean) {
		this.root.interactiveChildren = value
	}

	private initStack(side: "top" | "bottom") {
		this.root.getElement(side).children.forEach((stack, index) => {
			stack.getElement("indicator").on("pointertap", () => this.onCardClick(index, side))
		})
	}

	private set phase(state: GamePhase) {
		this._phase = state
		this.render()
	}

	private get phase() {
		return this._phase
	}

	private onCardClick(index: number, side: "top" | "bottom") {
		if (!this.instance) {
			throw new Error()
		}
		const player = this.instance.state.player
		this.instance.pushState()
		if (this.phase == GamePhase.MOVE_CARD) {
			if (side == "top") {
				player.thievesGold += index == 0 ? -1 : 1
				player.thievesMeat += index == 0 ? 1 : -1
			} else {
				player.miners += index == 1 ? -1 : 1
				player.farmers += index == 1 ? 1 : -1
			}
			this.instance.state.cardsMoved += 1
		} else {
			[
				() => player.thievesGold += 1,
				() => player.miners += 1,
				() => player.dunmer += 1,
				() => (player.altmer += 1, this.instance!.state.altmerPlayed += 1),
				() => player.bosmer += 1,
				() => player.farmers += 1,
				() => player.thievesMeat += 1
			][index]()
			this.instance.state.cardsPlayed += 1
		}
		this.phase = GamePhase.IDLE
		this.render()
	}

	public setButton(buttonName: string, state: boolean) {
		const button = this.root.getElement(buttonName)
		state = this.phase != GamePhase.DEFEAT && this.phase != GamePhase.VICTORY && state
		button.interactive = state
		button.alpha = state ? 1 : 0.4
		if (button.name == "move" || button.name == "play") {
			button.getElement<SpriteElement>("icon").image = `card-game-button-${button.name}${state ? "" : "-inactive"}`
		}
	}

	public render() {
		if (!this.instance) {
			throw new Error()
		}
		const state = this.instance.state
		this.applyState("top", state.opponent, state.player)
		this.applyState("bottom", state.player, state.opponent)
		this.setButton("buttons.rules", true)
		this.setButton("buttons.surrender", this.phase != GamePhase.WAIT)
		this.setButton("buttons.undo", (
			(this.phase == GamePhase.IDLE && this.instance.undoStackSize > 0) ||
			this.phase == GamePhase.MOVE_CARD ||
			this.phase == GamePhase.PLAY_CARD
		))
		this.setButton("buttons.turn", this.phase == GamePhase.IDLE)
		this.setButton("buttons.play", (this.phase == GamePhase.IDLE) && CardGame.getPlacementMoves(state.player).length > 0 && (
			(state.cardsPlayed == 0 && state.cardsMoved <= 1) ||
			(state.cardsPlayed <= (state.player.altmer - state.altmerPlayed) && state.cardsMoved == 0)
		))
		this.setButton("buttons.move", (this.phase == GamePhase.IDLE) && CardGame.getReallocationMoves(state.player).length > 0 && (
			(state.cardsMoved == 0 && state.cardsPlayed <= 1) ||
			(state.cardsMoved <= (state.player.altmer - state.altmerPlayed) && state.cardsPlayed == 0)
		))
		this.statusText = {
			[GamePhase.IDLE]: "Khajiit's turn",
			[GamePhase.PLAY_CARD]: "Choose card to play",
			[GamePhase.MOVE_CARD]: "Choose card to move",
			[GamePhase.WAIT]: "The opponent is making his turn",
			[GamePhase.VICTORY]: "The Khajiit has won!",
			[GamePhase.DEFEAT]: "The Khajiit has been defeated!"
		}[this.phase]
		if (this.phase == GamePhase.PLAY_CARD) {
			const moves = new Set(CardGame.getPlacementMoves(state.player))
			console.log(moves)
			const top = this.root.getElement("top")
			const bottom = this.root.getElement("bottom")
			moves.has(CardGame.Moves.PLACE_GOLD_THIEF) && this.setIndicator(top.children[0], state.player.thievesGold || 1, 1)
			moves.has(CardGame.Moves.PLACE_MEAT_THIEF) && this.setIndicator(top.children[6], state.player.thievesMeat || 1, 1)
			moves.has(CardGame.Moves.PLACE_MINER) && this.setIndicator(bottom.children[1], state.player.miners || 1, -1)
			moves.has(CardGame.Moves.PLACE_DUNMER) && this.setIndicator(bottom.children[2], state.player.dunmer || 1, -1)
			moves.has(CardGame.Moves.PLACE_ALTEMR) && this.setIndicator(bottom.children[3], state.player.altmer || 1, -1)
			moves.has(CardGame.Moves.PLACE_BOSMER) && this.setIndicator(bottom.children[4], state.player.bosmer || 1, -1)
			moves.has(CardGame.Moves.PLACE_FARMER) && this.setIndicator(bottom.children[5], state.player.farmers || 1, -1)
		} else if (this.phase == GamePhase.MOVE_CARD) {
			const moves = new Set(CardGame.getReallocationMoves(state.player))
			console.log(moves)
			const top = this.root.getElement("top")
			const bottom = this.root.getElement("bottom")
			moves.has(CardGame.Moves.REALLOCATE_GOLD_THIEF) && this.setIndicator(top.children[0], state.player.thievesGold - 1)
			moves.has(CardGame.Moves.REALLOCATE_MEAT_THIEF) && this.setIndicator(top.children[6], state.player.thievesMeat - 1)
			moves.has(CardGame.Moves.REALLOCATE_MINER) && this.setIndicator(bottom.children[1], state.player.miners - 1)
			moves.has(CardGame.Moves.REALLOCATE_FARMER) && this.setIndicator(bottom.children[5], state.player.farmers - 1)
		}
		if (this.phase == GamePhase.VICTORY) {
			this.instance.resolve(true)
		} else if (this.phase == GamePhase.DEFEAT) {
			this.instance.resolve(false)
		}
	}

	public set statusText(value: string) {
		this.root.getElement<TextElement>("status").setText(value)
	}

	protected renderStack(stack: BaseElement, count: number, max: number) {
		stack.getElement<TextElement>("count").setFormattedText(count, max)
		let cards
		if (this.phase == GamePhase.MOVE_CARD || this.phase == GamePhase.PLAY_CARD || count == 0) {
			cards = stack.getElement("cards-inactive")
			stack.getElement("cards").enabled = false
		} else {
			cards = stack.getElement("cards")
			stack.getElement("cards-inactive").enabled = false
		}
		cards.enabled = true
		cards.children[0].alpha = count == 0 ? 0.4 : 1
		cards.children.forEach((card, i) => card.enabled = i == 0 || i < count)
		stack.getElement("indicator").enabled = false
	}

	private setIndicator(stack: BaseElement, position: number, offset?: number) {
		const cards = stack.getElement("cards")
		const indicator = stack.getElement("indicator")
		indicator.enabled = true
		indicator.top = cards.children[position].top + (offset || 0) * 8
	}

	public applyState(boardName: "top" | "bottom", state: CardGame.StateObject, opponent: CardGame.StateObject) {
		const board = this.root.getElement(boardName)
		this.renderStack(board.children[0], opponent.thievesGold, 4)
		this.renderStack(board.children[1], state.miners, 1 << state.dunmer)
		this.renderStack(board.children[2], state.dunmer, 3)
		this.renderStack(board.children[3], state.altmer, 3)
		this.renderStack(board.children[4], state.bosmer, 3)
		this.renderStack(board.children[5], state.farmers, 1 << state.bosmer)
		this.renderStack(board.children[6], opponent.thievesMeat, 4)
		this.root.getElement<TextElement>("gold-" + boardName).setFormattedText(state.gold, state.miners - state.altmer - opponent.thievesGold)
		this.root.getElement<TextElement>("meat-" + boardName).setFormattedText(state.meat, state.farmers - state.miners - state.altmer - opponent.thievesMeat)
	}
}
