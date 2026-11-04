// Tests for the no-globals check (ticket 05, spec 3.1: "No ambient globals in
// `src/`"). The check is a CLI: `node no-globals.mjs <dir>` exits 0 when
// `<dir>` has no `declare global` and no non-module `.d.ts`, and 1 otherwise.
//
// Run: pnpm --filter astro-church test

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

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
	expect(result.status, result.stderr).toBe(0);
});

test("fails on a fixture with `declare global`", () => {
	const result = runCheck(fixture("declare-global"));
	expect(result.status).toBe(1);
	expect(result.stderr).toMatch(/env\.ts/);
	expect(result.stderr).toMatch(/declare global/);
});

test("fails on a fixture non-module `.d.ts`", () => {
	const result = runCheck(fixture("script-dts"));
	expect(result.status).toBe(1);
	expect(result.stderr).toMatch(/globals\.d\.ts/);
	expect(result.stderr).toMatch(/non-module/);
});

test("fails on a fixture non-module `.d.mts`", () => {
	const result = runCheck(fixture("script-dmts"));
	expect(result.status).toBe(1);
	expect(result.stderr).toMatch(/globals\.d\.mts/);
	expect(result.stderr).toMatch(/non-module/);
});

test("ignores globals in a `client/` folder next to `src/`", () => {
	const result = runCheck(join(fixture("with-client"), "src"));
	expect(result.status, result.stderr).toBe(0);
});
