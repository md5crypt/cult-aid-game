import { TextureStorage } from "./Resources"

interface TextureAtlasJson {
	type: "textureAtlas"
	data: {
		baseTextures: string[]
		frames: Record<string, (number[] | number[][])>
	}
}

class TextureAtlasLoader implements PIXI.ILoaderPlugin {
	public static use(this: PIXI.Loader, resource: PIXI.LoaderResource, next: (...params: any[]) => any) {
		if ((resource.type != PIXI.LoaderResource.TYPE.JSON) || (resource.data?.type != "textureAtlas")) {
			return next()
		}
		const loadOptions = {
			crossOrigin: resource.crossOrigin,
			metadata: resource.metadata.imageMetadata,
			parentResource: resource
		}
		const data = (resource.data as TextureAtlasJson).data
		Promise.all(data.baseTextures.map((path: string) => new Promise<PIXI.Texture>((resolve, reject) => this.add(
			path,
			path,
			loadOptions,
			(resource: PIXI.LoaderResource) => resource.error ? reject(resource.error) : resolve(resource.texture)
		)))).then(textures => {
			resource.data = new TextureStorage(data.frames, textures)
			next()
		}).catch(next)
	}
}

PIXI.Loader.registerPlugin(TextureAtlasLoader)
