class Resource {
	public static get(texture: keyof typeof ResourceId) {
		return context.Sprite.find(texture)
	}
}

export default Resource
