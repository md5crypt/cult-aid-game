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

	static equipHandler(item: InventoryItemName, callback?: (value?: string) => void | boolean | Promise<boolean | void>) {
		return async (value?: string) => {
			switch (value) {
				case "test":
					if (this.isFull) {
						this.open()
						await Fragment.execute("inventory-inventory-full")
						this.close()
						return true
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
						return callback(value)
					}
					break
			}
			return false
		}
	}

	static unEquipHandler(item: InventoryItemName, callback?: (value?: string) => void | boolean | Promise<boolean | void>) {
		return async (value?: string) => {
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
						return callback(value)
					}
					break
			}
			return false
		}
	}

	static get isFull() {
		return !!(storage.hands.left && storage.hands.right)
	}
}
