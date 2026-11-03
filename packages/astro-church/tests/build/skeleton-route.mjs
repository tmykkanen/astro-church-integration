// Build check (ticket 01): the Starter Site builds, and the output contains
// the injected route's page with the Theme component's markup.
//
// Run from anywhere: node packages/astro-church/tests/build/skeleton-route.mjs
// Exits 0 when the check passes, 1 when it fails.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Literals the Theme must produce. The route pattern belongs to the
// integration; the marker belongs to the Theme component, not the route file.
const ROUTE = "/theme-skeleton";
const MARKER = 'data-astro-church="skeleton-component"';

const site = new URL("../../../../playground/", import.meta.url);
const dist = new URL("dist/", site);
// With an adapter, prerendered pages and assets go to dist/client/.
const client = new URL("client/", dist);
const page = fileURLToPath(new URL(`.${ROUTE}/index.html`, client));

function fail(message) {
	console.error(`FAIL: ${message}`);
	process.exit(1);
}

// Build fresh, so a stale dist/ can't decide the result.
rmSync(dist, { recursive: true, force: true });
const build = spawnSync("pnpm", ["exec", "astro", "build"], {
	cwd: fileURLToPath(site),
	stdio: "inherit",
});
if (build.status !== 0) {
	fail(`the Starter Site build exited with ${build.status}`);
}

if (!existsSync(page)) {
	fail(`no page for ${ROUTE} in the Starter Site build (expected ${page})`);
}

if (!readFileSync(page, "utf8").includes(MARKER)) {
	fail(`the ${ROUTE} page doesn't contain the Theme component's ${MARKER}`);
}

console.log(`PASS: ${ROUTE} is built and renders the Theme component`);
