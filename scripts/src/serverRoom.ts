scripts.register("dialogStart", DialogId["technician-main"], () => {
	Fragment.showIf("technician-main.option.book", Inventory.has("book") && Fragment.seen("technician-main.option.reading"))
	Fragment.setVisibility("technician-main.option.sweetroll", Inventory.has("sweetroll"))
	return Fragment.executeIfUnseen("technician-intro")
})

scripts.register("fragmentInvoke", FragmentId["technician-main.option.book"], Inventory.unEquipHandler("book"))

scripts.register("zoneUse", ZoneId["server-technician"], () => {
	void Utils.executeDialog("technician-main")
})

scripts.register("zoneUse", ZoneId["server-power-supply"], () => {
	void Fragment.execute("technician-touch-server")
})
