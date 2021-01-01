const regex = /^(?:\/\/(?<comment>.+)|%(?<funcName>[^\s]+)(?:[ \t]+(?<funcArg>.+))?|@dialog[ \t]+(?<dialogId>[^\s]+)|@fragment[ \t]+(?<fragmentId>[^\s]+)|(?<promptMarker>@prompt)(?:[ \t]+(?<promptId>[^\s]+))?|@option(?:[ \t]+(?<optionModifier>hidden))?[ \t]+(?<optionId>[^\s]+)[\t ]*:[\t ]+(?<optionValue>.+)|(?<speechCharacter>[^@%\s][^\s:]*)([ \t]+(?<speechAvatar>[^\s]+))?[\t ]*:[\t ]+(?<speechValue>.+))$/

function parse(input, fname, data) {
	if (!data.fragments) {
		data.fragments = {}
	}
	if (!data.dialogs) {
		data.dialogs = {}
	}
	const lines = input.split(/\r?\n/).map(x => x.trim())
	let lineNumber = 0
	let currentDialog = null
	let currentDialogId = null
	let currentFragment = null
	for (const line of lines) {
		lineNumber += 1
		if (!line) {
			continue
		}
		const match = line.match(regex)
		if (!match) {
			throw new Error(`error parsing ${fname} on line ${lineNumber}: syntax error`)
		}
		const groups = match.groups
		if (groups.comment) {
			// do nothing
		} else if (groups.dialogId) {
			if (groups.dialogId in data.dialogs) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: dialog with id "${groups.dialogId}" already exists`)
			}
			currentFragment = null
			currentDialog = {
				prompts: [],
				options: []
			}
			currentDialogId = groups.dialogId
			data.dialogs[groups.dialogId] = currentDialog
		} else if (groups.fragmentId) {
			if (groups.fragmentId in data.fragments) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: fragment with id "${groups.fragmentId}" already exists`)
			}
			currentFragment = []
			currentDialog = null
			data.fragments[groups.fragmentId] = currentFragment
		} else if (groups.promptMarker) {
			if (currentDialog == null) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: prompt outside of dialog`)
			}
			const id = groups.promptId || "default"
			const fragmentId = currentDialogId + '.prompt.' + id
			if (fragmentId in data.fragments) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: prompt with id "${id}" already exists in current dialog`)
			}
			currentFragment = []
			currentDialog.prompts.push(id)
			data.fragments[fragmentId] = currentFragment
		} else if (groups.optionId) {
			if (currentDialog == null) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: option outside of dialog`)
			}
			const fragmentId = currentDialogId + '.option.' + groups.optionId
			if (fragmentId in data.fragments) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: option with id "${groups.optionId}" already exists in current dialog`)
			}
			currentDialog.options.push({
				text: groups.optionValue,
				id: groups.optionId,
				hidden: groups.optionModifier == "hidden" || undefined
			})
			currentFragment = []
			data.fragments[fragmentId] = currentFragment
		} else if (groups.speechCharacter) {
			if (currentFragment == null) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: speech outside of a fragment`)
			}
			if (!(groups.speechCharacter in data.characters)) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: use of unknown character "${groups.speechCharacter}"`)
			}
			if (groups.speechAvatar && !(groups.speechAvatar in data.characters[groups.speechCharacter].avatars)) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: use of unknown avatar "${groups.speechAvatar}"`)
			}
			currentFragment.push({
				character: groups.speechCharacter,
				avatar: groups.speechAvatar || undefined,
				text: groups.speechValue
			})
		} else if (groups.funcName) {
			if (currentFragment == null) {
				throw new Error(`error parsing ${fname} on line ${lineNumber}: function call outside of a fragment`)
			}
			currentFragment.push({
				function: groups.funcName,
				argument: groups.funcArg || undefined,
			})
		} else {
			console.error(groups)
			throw new Error(`error parsing ${fname} on line ${lineNumber}: unknown error`)
		}
	}
	return data
}

const functionTypes = {
	"push": ["dialog"],
	"replace": ["dialog"],
	"restart": ["dialog"],
	"pop": ["undefined", "number"],
	"exit": ["undefined"],
	"seen": ["undefined"],
	"show": ["undefined", "fragment"],
	"hide": ["undefined", "fragment"],
	"invoke": ["undefined", "string"],
}

const argParsers = {
	"string": x => x,
	"undefined": x => x === undefined ? undefined : null,
	"number": x => /^\d+$/.test(x) ? parseInt(x, 10) : null,
	"dialog": (x, data) => x in data.dialogs ? x : null,
	"fragment": (x, data, dialog) => (dialog && `${dialog}.option.${x}` in data.fragments) ? `${dialog}.option.${x}` : (x in data.fragments ? x : null)
}

function processFunction(element, data, fragment, dialog) {
	const list = functionTypes[element.function]
	if (!list) {
		throw new Error(`use of unknown function %${element.function} in fragment "${fragment}"`)
	}
	let value = null
	for (const parserName of list) {
		value = argParsers[parserName](element.argument, data, dialog)
		if (value !== null) {
			break
		}
	}
	if (value === null) {
		throw new Error(`unexpected argument "${element.argument}" for function %${element.function} in fragment "${fragment}"`)
	}
	element.argument = value
}

function finalize(data) {
	const visited = new Set()
	for (const dialogId in data.dialogs) {
		for (const prompt of data.dialogs[dialogId].prompts) {
			const fragmentId = `${dialogId}.prompt.${prompt}`
			const fragment = data.fragments[fragmentId]
			if (fragment.length != 1 || !fragment[0].character) {
				throw new Error(`invalid prompt contents in prompt ${fragmentId}`)
			}
			visited.add(fragmentId)
		}
		for (const option of data.dialogs[dialogId].options) {
			const fragmentId = `${dialogId}.option.${option.id}`
			for (const element of data.fragments[fragmentId]) {
				if (element.function) {
					processFunction(element, data, fragmentId, dialogId)
				}
			}
			visited.add(fragmentId)
		}
	}
	for (const fragmentId in data.fragments) {
		if (!visited.has(fragmentId)) {
			for (const element of data.fragments[fragmentId]) {
				if (element.function) {
					processFunction(element, data, fragmentId)
				}
			}
		}
	}
}

module.exports = {
	parse, finalize
}
