import { defineConfig } from "tsdown";

import pkg from "./package.json" with { type: "json" };

export default defineConfig([
	{
		entry: ["src/**/*.(ts|js)", "!src/**/*.d.ts", "!src/cms/scriptureField.ts"],
		format: ["esm"],
		target: "node22",
		unbundle: true,
		fixedExtension: false,
		dts: true,
		sourcemap: false,
		minify: false,
		tsconfig: "tsconfig.json",
		deps: {
			neverBundle: [
				...Object.keys(pkg.peerDependencies),
				// Keep Astro component as external, since Astro will take care of them
				/.*\.astro$/,
				// Keep virtual modules as external
				/^astro:.*/,
				// Keep JSON external so it's copied as an asset. Rolldown's
				// JSON handling generates named exports for valid-identifier top-level
				// keys, but in unbundle mode it emits the export specifiers without
				// declaring the bindings
				/.*\.json$/,
				/\?raw$/,
			],
		},
	},
	{
		entry: ["src/cms/scriptureField.ts"],
		platform: "browser",
		unbundle: false,
		dts: false,
		outDir: "dist/client",
		deps: {
			alwaysBundle: [
				"bible-passage-reference-parser/esm/bcv_parser.js",
				"bible-passage-reference-parser/esm/lang/en.js",
			],
			onlyBundle: false,
		},
	},
]);
