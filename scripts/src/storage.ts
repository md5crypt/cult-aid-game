const storageInitializer = {
	items: {
		book: false,
		sweetroll: false,
		scribbles: true,
		newspaper: false,
		key: false,
		inscription: false,
		map: false
	},
	library: {
		newspapers: false
	},
	librarian: {
		vampPaperSeen: false,
		knockedOut: false
	},
	technician: {
	},
	dialog: {
		hidden: {} as Record<FragmentId, boolean | undefined>,
		seen: {} as Record<FragmentId, boolean | undefined>
	}
}

type Storage = typeof storageInitializer
Object.assign(storage, storageInitializer)
