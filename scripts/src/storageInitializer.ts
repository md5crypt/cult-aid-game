import type { InventoryItemName } from "./api"

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
	},
	chef: {
	},
	plantation: {
		seenDoor: false,
		visited: false
	},
	thief: {
	},
	technician: {
	},
	archeologist: {
		visited: false
	},
	maid: {
	},
	bosmer: {
	},
	hobo: {
	},
	dialog: {
		hidden: {} as Record<FragmentId, boolean | undefined>,
		seen: {} as Record<FragmentId, boolean | undefined>,
		prompts: {} as Record<DialogId, string | undefined>
	}
}

Object.assign(storage, storageInitializer)

export default storageInitializer
