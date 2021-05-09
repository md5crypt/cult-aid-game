class Fragment {
	static seen(fragment: keyof typeof FragmentId) {
		return !!storage.dialog.seen[fragment]
	}

	static unseen(fragment: keyof typeof FragmentId) {
		return !storage.dialog.seen[fragment]
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

	static execute(fragment: keyof typeof FragmentId) {
		return context.speech.executeFragment(fragment)
	}

	static executeIfUnseen(fragment: keyof typeof FragmentId) {
		if (!storage.dialog.seen[fragment]) {
			return context.speech.executeFragment(fragment)
		}
		return Promise.resolve()
	}
}
