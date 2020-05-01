const rectShaderFrag = (count: number) => `
	varying vec2 vTextureCoord;
	varying vec4 vFrame;
	varying float vTextureId;
	uniform sampler2D uSamplers[${count}];
	uniform vec2 uSamplerSize[${count}];

	void main(void) {
		vec2 textureCoord = clamp(vTextureCoord, vFrame.xy, vFrame.zw);
		float textureId = floor(vTextureId + 0.5);
		vec4 color;
${
	Array(count).fill(0).map((_, i) => (
		((i > 0) ? "else " : "") + ((i < (count - 1)) ? `if(textureId == ${i}.0)` : "") +
		`{color = texture2D(uSamplers[${i}], textureCoord * uSamplerSize[${i}]);}`
	)).join("")
}
		gl_FragColor = color;
	}
`

const rectShaderVert = `
	attribute vec2 aVertexPosition;
	attribute vec2 aTextureCoord;
	attribute vec4 aFrame;
	attribute float aTextureId;

	uniform mat3 projTransMatrix;

	varying vec2 vTextureCoord;
	varying float vTextureId;
	varying vec4 vFrame;

	void main(void) {
		gl_Position = vec4((projTransMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
		vTextureCoord = aTextureCoord;
		vFrame = aFrame;
		vTextureId = aTextureId;
	}
`

export class RectTileShader extends PIXI.Shader {
	constructor(maxTextures: number) {
		super(new PIXI.Program(rectShaderVert, rectShaderFrag(maxTextures)), {
			uSamplers: new Array(maxTextures).fill(0).map((_, i) => i),
			uSamplerSize: [],
			projTransMatrix: new PIXI.Matrix()
		})
	}
}
