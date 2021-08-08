import { EventKeyArray } from "./Utils"

export class Item {
	static get(item: keyof typeof ItemId) {
		return context.map.getObject("item", item)
	}

	static show(item: keyof typeof ItemId) {
		this.get(item).enabled = true
	}

	static hide(item: keyof typeof ItemId) {
		this.get(item).enabled = false
	}

	static setVisibility(item: keyof typeof ItemId, value: boolean) {
		this.get(item).enabled = value
	}

	static setTexture(item: keyof typeof ItemId, texture: keyof typeof ResourceId) {
		this.get(item).setTexture(context.Sprite.find(texture))
	}

	static create(texture: keyof typeof ResourceId) {
		return context.Item.create(texture)
	}

	static onEnter(item: EventKeyArray<typeof ItemId>, callback: Types.ScriptStorageMapping["itemEnterView"]) {
		scripts.register("itemEnterView", item, callback)
	}

	static onExit(item: EventKeyArray<typeof ItemId>, callback: Types.ScriptStorageMapping["itemExitView"]) {
		scripts.register("itemExitView", item, callback)
	}

	static onUpdate(item: EventKeyArray<typeof ItemId>, callback: Types.ScriptStorageMapping["itemUpdate"]) {
		scripts.register("itemUpdate", item, callback)
	}
}

export default Item
