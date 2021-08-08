const path = require("path")
const fs = require("fs")
const WebpackBeforeBuildPlugin = require("before-build-webpack")
const GameAssetPlugin = require("./GameAssetPlugin")

const express = require("express")

const scripts = env => ({
	name: "scripts",
	entry: "./scripts/src/index",
	mode: env.production ? "production" : "development",
	output: {
		filename: "scripts.js",
		path: path.resolve(__dirname, "build")
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	devtool: false,
	module: {
		rules: [
			{
				test: /\.(ts)$/,
				use: {
					loader: "ts-loader",
					options: {
						configFile: path.resolve(__dirname, "scripts/tsconfig.json")
					}
				}
			}
		]
	},
	plugins: [
		new WebpackBeforeBuildPlugin(async (_, callback) => {
			while (!fs.existsSync(path.resolve(__dirname, "build/engine.js"))) {
				console.log("waiting for engine build to complete...")
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
			callback()
		})
	],
	performance: {
		hints: false
	}
})

const engine = env => ({
	name: "engine",
	entry: "./engine/src/main",
	mode: env.production ? "production" : "development",
	output: {
		filename: "engine.js",
		path: path.resolve(__dirname, "build")
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	devtool: "source-map",
	devServer: {
		port: 8080,
		writeToDisk: true,
		injectClient: compilerConfig => compilerConfig.name == "engine",
		injectHot: compilerConfig => compilerConfig.name == "engine",
		before: app => {
			app.use(express.static(path.resolve(__dirname, "build")))
			app.use(express.static(path.resolve(__dirname, "static")))
		}
	},
	module: {
		rules: [
			{
				test: /\.(ts)$/,
				use: {
					loader: "ts-loader",
					options: {
						configFile: path.resolve(__dirname, "engine/tsconfig.json")
					}
				}
			}
		]
	},
	plugins: [
		new GameAssetPlugin()
	],
	performance: {
		hints: false
	}
})

module.exports = [engine, scripts]
