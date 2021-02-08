const storageInitializer = {
	items: {
		book: false,
		sweetroll: false,
		scribbles: false,
		newspaper: false,
		key: false,
		inscription: false,
		map: false
	},
	librarian: {
		libraryEntered: false
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
