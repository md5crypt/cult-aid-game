class Debug {
	static registerTestChest(name: string, items: InventoryItemName[]) {
		const dialogId = name + "-test-chest" as DialogId
		const itemId = "item-" + name + "-test-chest" as ItemId
		const zoneId = "zone-" + name + "-test-chest" as ZoneId
		for (const item of items) {
			scripts.register("fragmentInvoke", dialogId + ".option." + item, Inventory.equipHandler(item))
		}
		scripts.register("dialogStart", dialogId, () => {
			for (const item of items) {
				Fragment.setVisibility( dialogId + ".option." + item as any, !Inventory.has(item))
			}
		})
		scripts.register("zoneUse", zoneId, async () => {
			const chest = context.map.getObject<"item">(itemId)
			chest.setTexture(context.Sprite.find("object-chest-open"))
			await Dialog.execute(dialogId)
			chest.setTexture(context.Sprite.find("object-chest"))
		})
	}
}
