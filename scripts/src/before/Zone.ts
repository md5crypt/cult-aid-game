class Zone {
	static get(zone: keyof typeof ZoneId) {
		return context.map.getObject<"zone">("zone-" + zone)
	}

	static onEnter(zone: keyof typeof ZoneId, callback: Types.ScriptStorageMapping["zoneEnter"]) {
		scripts.register("zoneEnter", "zone-" + zone, callback)
	}

	static onExit(zone: keyof typeof ZoneId, callback: Types.ScriptStorageMapping["zoneExit"]) {
		scripts.register("zoneExit", "zone-" + zone, callback)
	}

	static onUse(zone: keyof typeof ZoneId, callback: Types.ScriptStorageMapping["zoneUse"]) {
		scripts.register("zoneUse", "zone-" + zone, callback)
	}
}
