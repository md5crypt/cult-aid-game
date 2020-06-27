namespace NPC {
	const Character = context.Speech.Character

	export const zombii = new Character({
		name: "Zombii",
		color: "darkred",
		avatars: {
			default: "avatar-test"
		}
	})

	export const khajiit = new Character({
		name: "Khajiit",
		color: "darkgreen",
		defaultSide: "right",
		avatars: {
			default: "avatar-test"
		}
	})
}
