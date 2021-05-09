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

	static open() {
		context.ui.inventory.open(
			storage.hands.left && inventoryItems[storage.hands.left].image,
			storage.hands.right && inventoryItems[storage.hands.right].image
		)
	}

	static close() {
		context.ui.inventory.close()
	}

	static equipHandler(item: InventoryItemName) {
		return async (value?: string) => {
			if (value == "test") {
				if (this.isFull) {
					this.open()
					await Fragment.execute("inventory-inventory-full")
					this.close()
					return true
				}
			} else if (value == "open") {
				context.ui.dialog.hide()
				Inventory.add(item, true)
				await context.timer.wait(2000)
				context.ui.dialog.show()
			} else {
				Inventory.close()
			}
			return false
		}
	}

	static unEquipHandler(item: InventoryItemName) {
		return async (value?: string) => {
			if (value == "open") {
				context.ui.dialog.hide()
				Inventory.remove(item, true)
				await context.timer.wait(2000)
				context.ui.dialog.show()
			} else {
				Inventory.close()
			}
			return false
		}
	}

	static get isFull() {
		return !!(storage.hands.left && storage.hands.right)
	}
}
