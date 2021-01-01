export class GrayscaleFilter extends PIXI.Filter {
	private static _instance: GrayscaleFilter | null = null
	private static fragment = `
		varying vec2 vTextureCoord;
		uniform sampler2D uSampler;

		void main(void) {
			vec4 sample = texture2D(uSampler, vTextureCoord);
			gl_FragColor = vec4(vec3(0.3 * sample.r + 0.59 * sample.g + 0.11 * sample.b), sample.a);
		}
	`

	private constructor() {
		super(PIXI.defaultVertex, GrayscaleFilter.fragment)
	}

	public static get instance() {
		if (GrayscaleFilter._instance == null) {
			GrayscaleFilter._instance = new GrayscaleFilter()
		}
		return GrayscaleFilter._instance
	}
}
