interface Storage {
	dialog: {
		hidden: Record<FragmentId, boolean | undefined>
		seen: Record<FragmentId, boolean | undefined>
	}
	items: {
		book?: boolean
		sweetroll?: boolean
	}
	technician: {
		introSeen?: boolean
	}
}

Object.assign(storage, {
	dialog: {
		hidden: {},
		seen: {}
	},
	items: {},
	technician: {}
})
