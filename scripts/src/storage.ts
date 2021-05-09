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
		visited: false
	},
	technician: {
	},
	archeologist: {
		visited: false
	},
	maid: {
		needsInscription: false
	},
	dialog: {
		hidden: {} as Record<FragmentId, boolean | undefined>,
		seen: {} as Record<FragmentId, boolean | undefined>
	}
}

type Storage = typeof storageInitializer
Object.assign(storage, storageInitializer)
