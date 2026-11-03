// No-globals check (ticket 05, spec 3.1): shipped source declares no ambient
// globals. Fails on a `declare global`, or on a non-module declaration file
// (`.d.ts`, `.d.mts`, `.d.cts`), under `<dir>`.
//
// Usage: node packages/astro-church/tests/checks/no-globals.mjs <dir>
// `<dir>` resolves from the current directory; `pnpm check:globals` passes
// `packages/astro-church/src` from the repo root. Only that folder is checked,
// so `client/` (browser-only, may declare globals) is never read.
// Exits 0 when clean, 1 when it finds a global (each one on stderr).

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SOURCE_FILE = /\.(ts|mts|cts|astro)$/;
const DECLARATION_FILE = /\.d\.(ts|mts|cts)$/;
const DECLARE_GLOBAL = /\bdeclare\s+global\b/;
// A line starting with `import` or `export` makes a file a module. A regex,
// not a parser: a comment line that starts with `export` (no `//` or `*`
// before it) would count, which is fine for our own source.
const MODULE_SYNTAX = /^\s*(import|export)\b/m;

const dir = process.argv[2];
if (!dir) {
	console.error("Usage: node no-globals.mjs <dir>");
	process.exit(1);
}

const problems = [];

for (const entry of readdirSync(dir, {
	recursive: true,
	withFileTypes: true,
})) {
	if (!entry.isFile() || !SOURCE_FILE.test(entry.name)) continue;
	const path = join(entry.parentPath, entry.name);
	const text = readFileSync(path, "utf8");
	if (DECLARE_GLOBAL.test(text)) {
		problems.push(`${relative(dir, path)}: declare global`);
	}
	if (DECLARATION_FILE.test(entry.name) && !MODULE_SYNTAX.test(text)) {
		problems.push(
			`${relative(dir, path)}: non-module declaration file (no top-level import or export, so its declarations are global)`,
		);
	}
}

for (const problem of problems) console.error(`FAIL: ${problem}`);
process.exit(problems.length > 0 ? 1 : 0);
