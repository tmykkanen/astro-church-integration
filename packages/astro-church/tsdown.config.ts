import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["client/**/*.ts", "!client/**/*.d.ts"],
	tsconfig: "client/tsconfig.json",
	platform: "browser",
	dts: false,
	outDir: "dist/client",
	deps: {
		// The bundle loads as one script on the CMS page, so every dependency is inlined.
		alwaysBundle: [/.*/],
		// Bundling dependencies is the point here; turn off tsdown's hint about it.
		onlyBundle: false,
	},
});
