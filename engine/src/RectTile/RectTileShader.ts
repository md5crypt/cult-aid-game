import { Shader, Program } from "@pixi/core"
import { Matrix } from "@pixi/math"

const rectShaderFrag = (count: number) => `
	varying vec2 vTextureCoord;
	varying float vTextureId;
	uniform sampler2D uSamplers[${count}];
	uniform vec2 uSamplerSize[${count}];

	void main(void) {
${
	Array(count).fill(0).map((_, i) => (
		((i > 0) ? "else " : "") + ((i < (count - 1)) ? `if(vTextureId == ${i}.0)` : "") +
		`{gl_FragColor = texture2D(uSamplers[${i}], vTextureCoord / uSamplerSize[${i}]);}`
	)).join("")
}
	}
`

const rectShaderVert = `
	attribute vec2 aVertexPosition;
	attribute vec2 aTextureCoord;
	attribute float aTextureId;

	uniform mat3 projTransMatrix;

	varying vec2 vTextureCoord;
	varying float vTextureId;

	void main(void) {
		gl_Position = vec4((projTransMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
		vTextureCoord = aTextureCoord;
		vTextureId = aTextureId;
	}
`

export class RectTileShader extends Shader {
	constructor(maxTextures: number) {
		super(new Program(rectShaderVert, rectShaderFrag(maxTextures)), {
			uSamplers: new Array(maxTextures).fill(0).map((_, i) => i),
			uSamplerSize: [],
			projTransMatrix: new Matrix()
		})
	}
}
