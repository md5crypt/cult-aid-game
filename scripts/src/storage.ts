const storageInitializer = {
	hands: {
		left: null as (InventoryItemName | null),
		right: null as (InventoryItemName | null)
	},
	chest: {} as Record<InventoryItemName, boolean>,
	library: {
		newspapers: false
	},
	librarian: {
		vampPaperSeen: false,
		knockedOut: false
	},
	chef: {
		isBreeder: false
	},
	plantation: {
		seenDoor: false,
		visited: false
	},
	thief: {
		visited: false,
		knockedOut: false
	},
	technician: {
	},
	archeologist: {
		visited: false
	},
	maid: {
		needsInscription: false
	},
	bosmer: {
		seenMirror: false
	},
	dialog: {
		hidden: {} as Record<FragmentId, boolean | undefined>,
		seen: {} as Record<FragmentId, boolean | undefined>
	}
}

type Storage = typeof storageInitializer
Object.assign(storage, storageInitializer)

// storage.dialog.seen["chef-intro"] = true
// storage.dialog.seen["chef-post-intro"] = true
