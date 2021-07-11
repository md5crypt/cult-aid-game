type InventoryItemName = keyof typeof inventoryItems

class Inventory {
	static has(item: InventoryItemName) {
		return storage.hands.left == item || storage.hands.right == item
	}

	static add(item: InventoryItemName, triggerUI = false) {
		if (this.isFull) {
			return false
		}
		if (!storage.hands.right) {
			if (triggerUI) {
				context.ui.inventory.replaceRight(inventoryItems[item].image)
				this.open()
			}
			storage.hands.right = item
		} else {
			if (triggerUI) {
				context.ui.inventory.replaceLeft(inventoryItems[item].image)
				this.open()
			}
			storage.hands.left = item
		}
		return true
	}

	static replace(from: InventoryItemName, to: InventoryItemName, triggerUI = false) {
		if (storage.hands.right == from) {
			if (triggerUI) {
				context.ui.inventory.replaceRight(inventoryItems[to].image)
			}
			storage.hands.right = to
		} else if (storage.hands.left == from) {
			if (triggerUI) {
				context.ui.inventory.replaceLeft(inventoryItems[to].image)
			}
			storage.hands.left = to
		}
	}

	static remove(item: InventoryItemName, triggerUI = false) {
		if (storage.hands.right == item) {
			if (triggerUI) {
				context.ui.inventory.replaceRight(null)
				this.open()
			}
			storage.hands.right = null
			return true
		}
		if (storage.hands.left == item) {
			if (triggerUI) {
				context.ui.inventory.replaceLeft(null)
				this.open()
			}
			storage.hands.left = null
			return true
		}
		return false
	}

	static open(item?: InventoryItemName) {
		if (item) {
			if (storage.hands.left == item) {
				context.ui.inventory.openLeft(inventoryItems[item].image)
			} else if (storage.hands.right == item) {
				context.ui.inventory.openRight(inventoryItems[item].image)
			}
		} else {
			context.ui.inventory.open(
				storage.hands.left && inventoryItems[storage.hands.left].image,
				storage.hands.right && inventoryItems[storage.hands.right].image
			)
		}
	}

	static close() {
		context.ui.inventory.close()
	}

	static equipHandler<T extends undefined | string>(item: InventoryItemName, callback?: (value: Exclude<T, "test" | "open" | "close">) => void | Promise<void>) {
		return async (value: Exclude<"open" | "close" | "test", T> extends never ? T : "required invoke calls missing in fragment") => {
			switch (value) {
				case "test":
					if (this.isFull) {
						Fragment.replace("inventory-inventory-full")
					}
					break
				case "open":
					Dialog.hidden = true
					Inventory.add(item, true)
					await context.timer.wait(2000)
					Dialog.hidden = false
					break
				case "close":
					Inventory.close()
					break
				default:
					if (callback) {
						return callback(value as any)
					}
					break
			}
		}
	}

	static unEquipHandler<T extends undefined | string>(item: InventoryItemName, callback?: (value: Exclude<T, "open" | "close">) => void | Promise<void>) {
		return async (value: Exclude<"open" | "close", T> extends never ? T : "required invoke calls missing in fragment") => {
			switch (value) {
				case "open":
					Dialog.hidden = true
					Inventory.remove(item, true)
					await context.timer.wait(2000)
					Dialog.hidden = false
					break
				case "close":
					Inventory.close()
					break
				default:
					if (callback) {
						return callback(value as any)
					}
					break
			}
		}
	}

	static get isFull() {
		return !!(storage.hands.left && storage.hands.right)
	}
}

scripts.register("fragmentInvoke", FragmentId["inventory-inventory-full"], action => {
	if (action == "open") {
		Inventory.open()
	} else {
		Inventory.close()
	}
})
