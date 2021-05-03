scripts.register("dialogStart", DialogId["technician-main"], () => {
	storage.dialog.hidden["technician-main.option.book"] = !(storage.items.book && storage.dialog.seen["technician-main.option.reading"])
	storage.dialog.hidden["technician-main.option.sweetroll"] = !storage.items.sweetroll
	return utils.executeIfUnseen("technician-intro")
})

scripts.register("zoneUse", ZoneId["server-technician"], () => {
	void utils.executeDialog("technician-main")
})

scripts.register("zoneUse", ZoneId["server-power-supply"], () => {
	void utils.executeFragment("technician-touch-server")
})
