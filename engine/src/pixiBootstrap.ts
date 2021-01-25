import { InteractionManager } from "@pixi/interaction"
import { Renderer, BatchRenderer } from "@pixi/core"
import { TilingSpriteRenderer } from "@pixi/sprite-tiling"
import { TickerPlugin } from "@pixi/ticker"
import { Application } from "@pixi/app"
import { AppLoaderPlugin } from "@pixi/loaders"

// Install renderer plugins
Renderer.registerPlugin("interaction", InteractionManager)
Renderer.registerPlugin("batch", BatchRenderer)
Renderer.registerPlugin("tilingSprite", TilingSpriteRenderer)
// Install application plugins
Application.registerPlugin(TickerPlugin)
Application.registerPlugin(AppLoaderPlugin)
