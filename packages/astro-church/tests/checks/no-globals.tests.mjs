// Tests for the no-globals check (ticket 05, spec 3.1: "No ambient globals in
// `src/`"). The check is a CLI: `node no-globals.mjs <dir>` exits 0 when
// `<dir>` has no `declare global` and no non-module `.d.ts`, and 1 otherwise.
//
// Run: node --test packages/astro-church/tests/checks/no-globals.tests.mjs
// Named `.tests.mjs`, not `.test.mjs`, so Vitest (ticket 06) doesn't collect it.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const check = fileURLToPath(new URL("./no-globals.mjs", import.meta.url));
const src = fileURLToPath(new URL("../../src/", import.meta.url));

function fixture(name) {
	return fileURLToPath(new URL(`./fixtures/${name}/`, import.meta.url));
}

function runCheck(dir) {
	return spawnSync(process.execPath, [check, dir], { encoding: "utf8" });
}

test("passes on the current src/", () => {
	const result = runCheck(src);
	assert.equal(result.status, 0, result.stderr);
});

test("fails on a fixture with `declare global`", () => {
	const result = runCheck(fixture("declare-global"));
	assert.equal(result.status, 1);
	assert.match(result.stderr, /env\.ts/);
	assert.match(result.stderr, /declare global/);
});

test("fails on a fixture non-module `.d.ts`", () => {
	const result = runCheck(fixture("script-dts"));
	assert.equal(result.status, 1);
	assert.match(result.stderr, /globals\.d\.ts/);
	assert.match(result.stderr, /non-module/);
});

test("fails on a fixture non-module `.d.mts`", () => {
	const result = runCheck(fixture("script-dmts"));
	assert.equal(result.status, 1);
	assert.match(result.stderr, /globals\.d\.mts/);
	assert.match(result.stderr, /non-module/);
});

test("ignores globals in a `client/` folder next to `src/`", () => {
	const result = runCheck(join(fixture("with-client"), "src"));
	assert.equal(result.status, 0, result.stderr);
});
