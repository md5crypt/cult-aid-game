import { TextureStorage } from "./Resources"
import { ILoaderResource, AppLoaderPlugin, ILoaderPlugin, Loader, LoaderResource } from "@pixi/loaders"
import { Texture } from "@pixi/core"

interface TextureAtlasJson {
	type: "textureAtlas"
	data: {
		baseTextures: string[]
		frames: Record<string, (number[] | number[][])>
	}
}

class TextureAtlasLoader implements ILoaderPlugin {
	public static use(this: Loader, resource: ILoaderResource, next: (...params: any[]) => any) {
		if ((resource.type != LoaderResource.TYPE.JSON) || (resource.data?.type != "textureAtlas")) {
			return next()
		}
		const loadOptions = {
			crossOrigin: resource.crossOrigin,
			metadata: resource.metadata.imageMetadata,
			parentResource: resource
		}
		const data = (resource.data as TextureAtlasJson).data
		Promise.all(data.baseTextures.map((path: string) => new Promise<Texture>((resolve, reject) => this.add(
			path,
			path,
			loadOptions,
			(resource: ILoaderResource) => resource.error ? reject(resource.error) : resolve(resource.texture as Texture)
		)))).then(textures => {
			resource.data = new TextureStorage(data.frames, textures)
			next()
		}).catch(next)
	}
}

Loader.registerPlugin(TextureAtlasLoader)
