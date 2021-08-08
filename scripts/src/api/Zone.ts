import { EventKeyArray } from "./Utils"

export class Zone {
	static get(zone: keyof typeof ZoneId) {
		return context.map.getObject("zone", zone)
	}

	static onEnter(zone: EventKeyArray<typeof ZoneId>, callback: Types.ScriptStorageMapping["zoneEnter"]) {
		scripts.register("zoneEnter", zone, callback)
	}

	static onExit(zone: EventKeyArray<typeof ZoneId>, callback: Types.ScriptStorageMapping["zoneExit"]) {
		scripts.register("zoneExit", zone, callback)
	}

	static onUse(zone: EventKeyArray<typeof ZoneId>, callback: Types.ScriptStorageMapping["zoneUse"]) {
		scripts.register("zoneUse", zone, callback)
	}
}

export default Zone
