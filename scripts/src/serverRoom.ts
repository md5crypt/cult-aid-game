scripts.register("dialogStart", DialogId["technician-main"], async () => {
	storage.dialog.hidden["technician-main.option.book"] = !(storage.items.book && storage.dialog.seen["technician-main.option.reading"])
	storage.dialog.hidden["technician-main.option.sweetroll"] = !storage.items.sweetroll
	if (!storage.dialog.seen["technician-intro"]) {
		await context.speech.executeFragment(FragmentId["technician-intro"])
	}
})

scripts.register("zoneUse", "technician", zone => {
	void context.speech.executeDialog(DialogId["technician-main"])
})

scripts.register("zoneUse", "power-supply", zone => {
	void context.speech.executeFragment(FragmentId["technician-touch-server"])
})
