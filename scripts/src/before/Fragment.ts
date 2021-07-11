class Fragment {
	static seen(...fragments: (keyof typeof FragmentId)[]) {
		return fragments.every(fragment => storage.dialog.seen[fragment])
	}

	static unseen(...fragments: (keyof typeof FragmentId)[]) {
		return fragments.every(fragment => !storage.dialog.seen[fragment])
	}

	static setSeen(fragment: keyof typeof FragmentId) {
		storage.dialog.seen[fragment] = true
	}

	static setSeenIf(fragment: keyof typeof FragmentId, condition: boolean) {
		if (condition) {
			storage.dialog.seen[fragment] = true
		}
	}

	static setVisibility(fragment: keyof typeof FragmentId, value: boolean) {
		storage.dialog.hidden[fragment] = !value
	}

	static setVisibilityIfUnseen(fragment: keyof typeof FragmentId, value: boolean) {
		if (!storage.dialog.seen[fragment]) {
			storage.dialog.hidden[fragment] = !value
		}
	}

	static hide(fragment: keyof typeof FragmentId) {
		storage.dialog.hidden[fragment] = true
	}

	static hideIf(fragment: keyof typeof FragmentId, condition: boolean) {
		if (condition) {
			storage.dialog.hidden[fragment] = true
		}
	}

	static show(fragment: keyof typeof FragmentId) {
		storage.dialog.hidden[fragment] = false
	}

	static showIf(fragment: keyof typeof FragmentId, condition: boolean) {
		if (condition) {
			storage.dialog.hidden[fragment] = false
		}
	}

	static showUnseenIf(fragment: keyof typeof FragmentId, condition: boolean) {
		if (!storage.dialog.seen[fragment] && condition) {
			storage.dialog.hidden[fragment] = false
		}
	}

	static execute(fragment?: keyof typeof FragmentId) {
		fragment && context.speech.pushFragment(fragment)
		return context.speech.start()
	}

	static push(fragment: keyof typeof FragmentId) {
		context.speech.pushFragment(fragment)
	}

	static pushIfUnseen(fragment: keyof typeof FragmentId) {
		if (!storage.dialog.seen[fragment]) {
			context.speech.pushFragment(fragment)
		}
	}

	static replace(fragment: keyof typeof FragmentId) {
		context.speech.popFragment()
		context.speech.pushFragment(fragment)
	}

	static pop(amount?: number) {
		context.speech.popFragment(amount)
	}

	static get current() {
		return context.speech.currentFragment as FragmentId | null
	}

	static onBefore(fragment: EventKeyArray<typeof FragmentId>, callback: Types.ScriptStorageMapping["fragmentBefore"]) {
		scripts.register("fragmentBefore", fragment, callback)
	}

	static onAfter(fragment: EventKeyArray<typeof FragmentId>, callback: Types.ScriptStorageMapping["fragmentAfter"]) {
		scripts.register("fragmentAfter", fragment, callback)
	}

	static onInvoke(fragment: EventKeyArray<typeof FragmentId>, callback: Types.ScriptStorageMapping["fragmentInvoke"]) {
		scripts.register("fragmentInvoke", fragment, callback)
	}
}
