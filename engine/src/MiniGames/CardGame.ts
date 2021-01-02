import { createWebWorker, TypedWorker } from "../utils"

export interface StateObject {
	gold: number
	meat: number
	miners: number
	farmers: number
	thievesGold: number
	thievesMeat: number
	dunmer: number
	bosmer: number
	altmer: number
}

export const enum Moves {
	PLACE_ALTEMR,
	PLACE_DUNMER,
	PLACE_BOSMER,
	PLACE_FARMER,
	PLACE_MINER,
	PLACE_GOLD_THIEF,
	PLACE_MEAT_THIEF,
	REALLOCATE_FARMER,
	REALLOCATE_MINER,
	REALLOCATE_GOLD_THIEF,
	REALLOCATE_MEAT_THIEF,
}

interface MinMaxWorkerQuery {
	maxPlayer: number
	minPlayer: number
	depth: number
}

export class MinMaxWorker {
	private worker: TypedWorker<MinMaxWorkerQuery, {state: number, score: number}>
	private resolve!: (state: StateObject) => void
	private reject!: (error: Error) => void

	public constructor() {
		this.worker = createWebWorker(MinMax)
		this.worker.onmessage = event => {
			console.log(`minmax score: ${event.data.score}`)
			this.resolve(toObject(event.data.state))
		}
		this.worker.onerror = event => this.reject(event.error)
	}

	public query(maxPlayer: StateObject, minPlayer: StateObject, depth: number) {
		return new Promise<StateObject>((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
			this.worker.postMessage({
				maxPlayer: fromObject(maxPlayer),
				minPlayer: fromObject(minPlayer),
				depth
			})
		})
	}

	public destroy() {
		this.worker.terminate()
	}
}

function getMoveDescription(before: StateObject, after: StateObject) {
	if (before.altmer != after.altmer) {
		return Moves.PLACE_ALTEMR
	}
	if (before.bosmer != after.bosmer) {
		return Moves.PLACE_BOSMER
	}
	if (before.dunmer != after.dunmer) {
		return Moves.PLACE_DUNMER
	}
	if (before.miners < after.miners && before.farmers == after.farmers) {
		return Moves.PLACE_MINER
	}
	if (before.miners < after.miners) {
		return Moves.REALLOCATE_FARMER
	}
	if (before.farmers < after.farmers && before.miners == after.miners) {
		return Moves.PLACE_FARMER
	}
	if (before.farmers != after.farmers) {
		return Moves.REALLOCATE_MINER
	}
	if (before.thievesGold < after.thievesGold && before.thievesMeat == after.thievesMeat) {
		return Moves.PLACE_GOLD_THIEF
	}
	if (before.thievesGold < after.thievesGold) {
		return Moves.REALLOCATE_MEAT_THIEF
	}
	if (before.thievesMeat < after.thievesMeat && before.thievesGold == after.thievesGold) {
		return Moves.PLACE_MEAT_THIEF
	}
	return Moves.REALLOCATE_GOLD_THIEF
}

export function getReallocationMoves(state: StateObject) {
	return getReallocations(fromObject(state)).map(x => getMoveDescription(state, toObject(x)))
}

export function getPlacementMoves(state: StateObject) {
	return getPlacements(fromObject(state)).map(x => getMoveDescription(state, toObject(x)))
}

export function updateState(state: StateObject, opponent: StateObject) {
	return toObject(update(fromObject(state), fromObject(opponent)))
}

export function newState() {
	return toObject(0)
}

export const enum GameConstants {
	MAX_WORKERS = 12,
	MAX_THIEVES = 4,
	MAX_GOLD = 20,
	MAX_MEAT = 20
}

const enum BitOffsets {
	/* 00 - 02 */ THIEVES_GOLD = 0,
	/* 03 - 05 */ THIEVES_MEAT = 3,
	/* 06 - 07 */ DUNMER = 6,
	/* 08 - 09 */ BOSMER = 8,
	/* 10 - 11 */ ALTMER = 10,
	/* 12 - 15 */ MINERS = 12,
	/* 16 - 19 */ FARMERS = 16,
	/* 20 - 24 */ GOLD = 20,
	/* 25 - 29 */ MEAT = 25
}

const enum BitMasks {
	STATE = (1 << BitOffsets.GOLD) - 1,
	GOLD = 31,
	THIEVES_GOLD = 7,
	MEAT = 31,
	THIEVES_MEAT = 7,
	MINERS = 15,
	FARMERS = 15,
	DUNMER = 3,
	BOSMER = 3,
	ALTMER = 3
}

function MinMax() {

	let stateTable: Uint32Array
	let moveTable: Uint32Array

	function getGold(state: number) {
		return (state >>> BitOffsets.GOLD) & BitMasks.GOLD
	}

	function setGold(state: number, value: number) {
		return (state & ~(BitMasks.GOLD << BitOffsets.GOLD)) | (value << BitOffsets.GOLD)
	}

	function getMeat(state: number) {
		return (state >>> BitOffsets.MEAT) & BitMasks.MEAT
	}

	function setMeat(state: number, value: number) {
		return (state & ~(BitMasks.MEAT << BitOffsets.MEAT)) | (value << BitOffsets.MEAT)
	}

	function getMiners(state: number) {
		return (state >>> BitOffsets.MINERS) & BitMasks.MINERS
	}

	function setMiners(state: number, value: number) {
		return (state & ~(BitMasks.MINERS << BitOffsets.MINERS)) | (value << BitOffsets.MINERS)
	}

	function getFarmers(state: number) {
		return (state >>> BitOffsets.FARMERS) & BitMasks.FARMERS
	}

	function setFarmers(state: number, value: number) {
		return (state & ~(BitMasks.FARMERS << BitOffsets.FARMERS)) | (value << BitOffsets.FARMERS)
	}

	function getThievesGold(state: number) {
		return (state >>> BitOffsets.THIEVES_GOLD) & BitMasks.THIEVES_GOLD
	}

	function setThievesGold(state: number, value: number) {
		return (state & ~(BitMasks.THIEVES_GOLD << BitOffsets.THIEVES_GOLD)) | (value << BitOffsets.THIEVES_GOLD)
	}

	function getThievesMeat(state: number) {
		return (state >>> BitOffsets.THIEVES_MEAT) & BitMasks.THIEVES_MEAT
	}

	function setThievesMeat(state: number, value: number) {
		return (state & ~(BitMasks.THIEVES_MEAT << BitOffsets.THIEVES_MEAT)) | (value << BitOffsets.THIEVES_MEAT)
	}

	function getDunmer(state: number) {
		return (state >>> BitOffsets.DUNMER) & BitMasks.DUNMER
	}

	function setDunmer(state: number, value: number) {
		return (state & ~(BitMasks.DUNMER << BitOffsets.DUNMER)) | (value << BitOffsets.DUNMER)
	}

	function getBosmer(state: number) {
		return (state >>> BitOffsets.BOSMER) & BitMasks.BOSMER
	}

	function setBosmer(state: number, value: number) {
		return (state & ~(BitMasks.BOSMER << BitOffsets.BOSMER)) | (value << BitOffsets.BOSMER)
	}

	function getAltmer(state: number) {
		return (state >>> BitOffsets.ALTMER) & BitMasks.ALTMER
	}

	function setAltmer(state: number, value: number) {
		return (state & ~(BitMasks.ALTMER << BitOffsets.ALTMER)) | (value << BitOffsets.ALTMER)
	}

	function getReallocations(state: number) {
		const result: number[] = []
		const miners = getMiners(state)
		const farmers = getFarmers(state)
		/* thieves */
		const thievesMeat = getThievesMeat(state)
		const thievesGold = getThievesGold(state)
		if (thievesGold >= 1) {
			result.push(setThievesGold(setThievesMeat(state, thievesMeat + 1), thievesGold - 1))
		}
		if (thievesMeat >= 1) {
			result.push(setThievesMeat(setThievesGold(state, thievesGold + 1), thievesMeat - 1))
		}
		/* farmers */
		if (farmers >= 1 && (miners < (1 << getDunmer(state)))) {
			result.push(setFarmers(setMiners(state, miners + 1), farmers - 1))
		}
		/* miners */
		if (miners >= 1 && (farmers < (1 << getBosmer(state)))) {;
			result.push(setMiners(setFarmers(state, farmers + 1), miners - 1))
		}
		return result
	}

	function getPlacements(state: number) {
		const result: number[] = []
		const dunmer = getDunmer(state)
		const bosmer = getBosmer(state)
		const miners = getMiners(state)
		const farmers = getFarmers(state)
		const workerLimit = ((farmers + miners) < GameConstants.MAX_WORKERS)
		/* farmer */
		if (workerLimit && (farmers < (1 << bosmer))) {
			result.push(setFarmers(state, farmers + 1))
		}
		/* miner */
		if (workerLimit && (miners < (1 << dunmer))) {
			result.push(setMiners(state, miners + 1))
		}
		/* thieves */
		const thievesMeat = getThievesMeat(state)
		const thievesGold = getThievesGold(state)
		if ((thievesMeat + thievesGold) < GameConstants.MAX_THIEVES) {
			result.push(setThievesGold(state, thievesGold + 1))
			result.push(setThievesMeat(state, thievesMeat + 1))
		}
		/* bosmer */
		if (bosmer < 3) {
			result.push(setBosmer(state, bosmer + 1))
		}
		/* dunmer */
		if (dunmer < 3) {
			result.push(setDunmer(state, dunmer + 1))
		}
		/* altemr */
		const altmer = getAltmer(state)
		if (altmer < 3) {
			result.push(setAltmer(state, altmer + 1))
		}
		return result
	}

	function applyRecursive(states: number[], depth: number, result: number[], transformation: (state: number) => number[], noAdd: boolean) {
		if (depth > 0) {
			for (let i = 0; i < states.length; i++) {
				applyRecursive(transformation(states[i]), depth - 1, result, transformation, false)
			}
		}
		if (!noAdd) {
			for (let i = 0; i < states.length; i++) {
				result.push(states[i])
			}
		}
	}

	function getNextStates(state: number) {
		const result: number[] = []
		const placements = getPlacements(state)
		const reallocations = getReallocations(state)
		const altmer = getAltmer(state)
		if (altmer > 0) {
			applyRecursive(placements, altmer, result, state => getPlacements(state), true)
		}
		for (let i = 0; i < placements.length; i++) {
			getReallocations(placements[i]).forEach(state => result.push(state))
		}
		for (let i = 0; i < placements.length; i++) {
			result.push(placements[i])
		}
		applyRecursive(reallocations, altmer, result, state => getReallocations(state), false)
		const set = new Set<number>()
		result.push(state)
		return result.filter(x => {
			if (set.has(x)) {
				return false
			}
			set.add(x)
			return true
		})
	}

	function generateLookupTables() {
		let offset = 1
		stateTable = new Uint32Array(1 << 20)
		moveTable = new Uint32Array(1 << 20)
		for (let i = 0; i <= BitMasks.STATE;  i++) {
			const miners = getMiners(i)
			const farmers = getFarmers(i)
			const isValid = (
				((getThievesGold(i) + getThievesMeat(i)) <= GameConstants.MAX_THIEVES) &&
				((miners + farmers) <= GameConstants.MAX_WORKERS) &&
				(miners <= (1 << getDunmer(i))) &&
				(farmers <= (1 << getBosmer(i)))
			)
			if (isValid) {
				stateTable[i] = offset
				for (const state of getNextStates(i)) {
					if (state == 0 ) {
						continue
					}
					moveTable[offset] = state
					offset += 1
				}
				moveTable[offset] = 0
				offset += 1
			} else {
				stateTable[i] = 0
			}
		}
	}

	function update(state: number, opponent: number) {
		// generate resources
		let meat = Math.min(GameConstants.MAX_MEAT, Math.max(0, getMeat(state) + getFarmers(state) - getThievesMeat(opponent)))
		let gold = Math.min(GameConstants.MAX_GOLD, Math.max(0, getGold(state) + getMiners(state) - getThievesGold(opponent)))
		// feed altmer
		let altmer = getAltmer(state)
		meat -= altmer
		gold -= altmer
		if (meat < 0 || gold < 0) {
			state = setAltmer(state, altmer + Math.min(meat, gold))
			meat = Math.max(0, meat)
			gold = Math.max(0, gold)
		}
		// feed miners
		let miners = getMiners(state)
		meat -= miners
		if (meat < 0) {
			state = setMiners(state, miners + meat)
			meat = 0
		}
		state = setMeat(state, meat)
		state = setGold(state, gold)
		return state
	}

	function isWinning(state: number) {
		return getAltmer(state) == 3
	}

	function getScore(state: number, opponent: number) {
		return (
			(getAltmer(state) * 2) +
			(getMiners(state) * 1.5) +
			(getFarmers(state) * 1.5) +
			(getBosmer(state) * 0.5) +
			(getDunmer(state) * 0.75) +
			(getMeat(state) * 0.1) +
			(getGold(state) * 1) +
			(Math.max(getMiners(state) - getThievesGold(opponent) - getAltmer(state), 0) * 0.75) +
			(Math.max(getFarmers(state) - getThievesMeat(opponent) - getAltmer(state) - getMiners(state), 0) * 0.25)
		)
	}

	function toObject(state: number) {
		return {
			gold: getGold(state),
			meat: getMeat(state),
			miners: getMiners(state),
			farmers: getFarmers(state),
			thievesGold: getThievesGold(state),
			thievesMeat: getThievesMeat(state),
			dunmer: getDunmer(state),
			bosmer: getBosmer(state),
			altmer: getAltmer(state)
		}
	}

	function fromObject(state: StateObject) {
		let value = 0
		value = setGold(value, state.gold)
		value = setMeat(value, state.meat)
		value = setMiners(value, state.miners)
		value = setFarmers(value, state.farmers)
		value = setThievesGold(value, state.thievesGold)
		value = setThievesMeat(value, state.thievesMeat)
		value = setDunmer(value, state.dunmer)
		value = setBosmer(value, state.bosmer)
		value = setAltmer(value, state.altmer)
		return value
	}

	function alphaBeta(maxPlayer: number, minPlayer: number, depth: number) {
		let alpha = -Infinity
		let beta = Infinity
		let value = -Infinity
		let best: number | null = null
		let index = stateTable[maxPlayer & BitMasks.STATE]
		while (true) {
			let state = moveTable[index]
			if (state == 0) {
				break
			}
			state |= maxPlayer & ~BitMasks.STATE
			const result = alphaBetaMin(state, minPlayer, alpha, beta, depth - 1)
			if (result > value || best == null) {
				best = state
				value = result
			}
			alpha = Math.max(alpha, value)
			if (alpha >= beta) {
				break
			}
			index += 1
		}
		return {state: best || maxPlayer, score: value}
	}

	function alphaBetaMax(maxPlayer: number, minPlayer: number, alpha: number, beta: number, depth: number) {
		maxPlayer = update(maxPlayer, minPlayer)
		if (isWinning(maxPlayer)) {
			return 1000 - getScore(minPlayer, maxPlayer)
		}
		if (depth == 0) {
			return getScore(maxPlayer, maxPlayer) - getScore(minPlayer, maxPlayer)
		}
		let value = -Infinity
		let index = stateTable[maxPlayer & BitMasks.STATE]
		let isFirst = true
		while (true) {
			let state = moveTable[index]
			if (state == 0) {
				break
			}
			state |= maxPlayer & ~BitMasks.STATE
			let score = 0
			if (!isFirst) {
				score = alphaBetaMin(state, minPlayer, alpha, alpha, depth - 1)
			}
			if (isFirst || (score > alpha)) {
				score = alphaBetaMin(state, minPlayer, alpha, beta, depth - 1)
				isFirst = false
			}
			value = Math.max(value, score)
			alpha = Math.max(alpha, value)
			if (alpha >= beta) {
				break
			}
			index += 1
		}
		return value
	}


	function alphaBetaMin(maxPlayer: number, minPlayer: number, alpha: number, beta: number, depth: number) {
		minPlayer = update(minPlayer, maxPlayer)
		if (isWinning(minPlayer)) {
			return getScore(maxPlayer, minPlayer) - 1000
		}
		if (depth == 0) {
			return getScore(maxPlayer, minPlayer) - getScore(minPlayer, maxPlayer)
		}
		let value = Infinity
		let index = stateTable[minPlayer & BitMasks.STATE]
		let isFirst = true
		while (true) {
			let state = moveTable[index]
			if (state == 0) {
				break
			}
			state |= minPlayer & ~BitMasks.STATE
			let score = 0
			if (!isFirst) {
				score = alphaBetaMax(maxPlayer, state, beta, beta, depth - 1)
			}
			if (isFirst || (score < beta)) {
				score = alphaBetaMax(maxPlayer, state, alpha, beta, depth - 1)
				isFirst = false
			}
			value = Math.min(value, score)
			beta = Math.min(beta, value)
			if (beta <= alpha) {
				break
			}
			index += 1
		}
		return value
	}

	if (typeof importScripts === "function") {
		generateLookupTables()
		onmessage = (event: Omit<MessageEvent, "data"> & {data: MinMaxWorkerQuery}) => (postMessage as any)(alphaBeta(event.data.maxPlayer, event.data.minPlayer,event.data.depth))
	}

	return {
		toObject,
		fromObject,
		getPlacements,
		getReallocations,
		update
	}
}

const {
	toObject,
	fromObject,
	getPlacements,
	getReallocations,
	update
} = MinMax()
