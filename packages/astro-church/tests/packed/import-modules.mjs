// Smoke check (ticket 02, R-3 #9): every module the tarball ships in `src/`
// loads through the Site's own Vite and Astro config, the way `astro dev`
// and `astro build` would load it. Bare Node can't import `.astro` files.
//
// The harness copies this file into the packed Site and runs it there, so
// `astro` and `astro-church` resolve from that Site's node_modules.
// Exits 0 when every module loads, 1 otherwise.

import { readdirSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { getViteConfig } from "astro/config";

// Vite isn't a direct dependency of the Site; load the copy Astro uses.
const fromAstro = createRequire(
	realpathSync("node_modules/astro/package.json"),
);
const { createServer } = await import(
	pathToFileURL(fromAstro.resolve("vite")).href
);

const config = await getViteConfig({ root: process.cwd(), logLevel: "warn" })({
	mode: "development",
	command: "serve",
});
const server = await createServer({
	...config,
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
});

// Code modules only: stylesheets and type declarations aren't imported on
// their own (ticket 03's built-CSS check covers styles).
const isCodeModule = (name) =>
	/\.(astro|[cm]?[jt]s)$/.test(name) && !/\.d\.[cm]?ts$/.test(name);

const src = join(realpathSync("node_modules/astro-church"), "src");
const modules = readdirSync(src, { recursive: true, withFileTypes: true })
	.filter((entry) => entry.isFile() && isCodeModule(entry.name))
	.map((entry) => join(entry.parentPath, entry.name));

const failures = [];
for (const file of modules) {
	try {
		await server.ssrLoadModule(file);
	} catch (error) {
		failures.push(`${relative(src, file)}: ${error?.message ?? error}`);
	}
}
// Astro builds its dev server app in the background when the server starts;
// closing before it finishes logs "transport was disconnected". Astro's own
// dev container awaits this (internal) promise. If it's ever renamed, this
// awaits undefined and the check still runs.
await server[Symbol.for("astro.devServerAppReady")];
await server.close();

if (modules.length === 0) {
	console.error(`FAIL: the packed package has no modules in ${src}`);
	process.exit(1);
}
if (failures.length > 0) {
	console.error(`FAIL: ${failures.length} shipped module(s) don't load:`);
	for (const failure of failures) console.error(`  ${failure}`);
	process.exit(1);
}
console.log(`PASS: all ${modules.length} shipped modules load`);
