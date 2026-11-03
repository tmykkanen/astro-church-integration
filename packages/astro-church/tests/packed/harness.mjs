// Packed-install harness (ticket 02, spec 3.1): packs the package, installs
// the tarball into a copy of the Starter Site outside the workspace, runs
// `astro check` and `astro build`, then the smoke checks.
//
// Run from anywhere: node packages/astro-church/tests/packed/harness.mjs
// Exits 0 when every check passes, 1 on the first failure. On failure the
// temporary directory is kept, and its path printed, for debugging.

import { spawnSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Literals the Theme must produce (same as tests/build/skeleton-route.mjs).
const ROUTE = "/theme-skeleton";
const MARKER = 'data-astro-church="skeleton-component"';

const testsDir = fileURLToPath(new URL(".", import.meta.url));
const repo = fileURLToPath(new URL("../../../../", import.meta.url));
const pkg = join(repo, "packages/astro-church");
const starter = join(repo, "playground");

const tempDir = realpathSync(
	mkdtempSync(join(tmpdir(), "astro-church-packed-")),
);
const site = join(tempDir, "site");

function fail(message) {
	console.error(`FAIL: ${message}`);
	console.error(`Temporary files kept at ${tempDir}`);
	process.exit(1);
}

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, stdio: "inherit" });
	const shown = `\`${command} ${args.join(" ")}\``;
	if (result.error) {
		fail(`${shown} couldn't start: ${result.error.message}`);
	}
	if (result.status !== 0) {
		fail(`${shown} exited with ${result.status ?? result.signal}`);
	}
}

function isInside(child, parent) {
	const rel = relative(parent, child);
	return !isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`);
}

// --- Setup ---------------------------------------------------------------

if (isInside(tempDir, repo)) {
	fail(`the temporary directory ${tempDir} is inside the workspace`);
}

// 1. Pack the package.
run("pnpm", ["pack", "--pack-destination", tempDir], pkg);
const tarballs = readdirSync(tempDir).filter((name) => name.endsWith(".tgz"));
if (tarballs.length !== 1) {
	fail(`expected one tarball in ${tempDir}, found ${tarballs.length}`);
}
const tarball = join(tempDir, tarballs[0]);

// Smoke check, run first because it needs no install: the tarball ships no
// test code. Tests and fixtures live in `tests/`, outside `src/`. Entries are
// listed as `package/<path>`.
const testCode = [
	/\.(test|spec)\.[cm]?[jt]sx?$/, // test files
	/(^|\/)(tests?|__tests__)\//, // test directories
];
const tarList = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
if (tarList.status !== 0) {
	fail(`\`tar -tzf\` couldn't list ${tarball}: ${tarList.stderr}`);
}
const tarEntries = tarList.stdout.split("\n").filter(Boolean);
const leaked = tarEntries.filter((entry) =>
	testCode.some((re) => re.test(entry)),
);
if (leaked.length > 0) {
	fail(`the tarball ships test code:\n  ${leaked.join("\n  ")}`);
}
console.log(
	`PASS: no test code among the tarball's ${tarEntries.length} entries`,
);

// 2. Copy the Starter Site, leaving out installed and generated files, and
// local env files, which can hold secrets and stay behind on failure.
const excludedDirs = new Set(["node_modules", "dist", ".astro"]);
cpSync(starter, site, {
	recursive: true,
	filter: (source) => {
		const top = relative(starter, source).split(sep)[0];
		return !excludedDirs.has(top) && !top.startsWith(".env");
	},
});

// 3. Point the Site at the tarball instead of `workspace:*`, and pin the
// workspace's pnpm, which doesn't apply outside the workspace.
const manifestPath = join(site, "package.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const rootManifest = JSON.parse(
	readFileSync(join(repo, "package.json"), "utf8"),
);
manifest.dependencies["astro-church"] = `file:${tarball}`;
manifest.packageManager = rootManifest.packageManager;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, "\t")}\n`);

// The workspace's build-script approvals (its `allowBuilds` block), so pnpm
// doesn't stop on them.
const workspaceYaml = readFileSync(join(repo, "pnpm-workspace.yaml"), "utf8");
const allowBuilds = workspaceYaml.match(/^allowBuilds:\n(?:[ \t]+\S.*\n?)+/m);
if (!allowBuilds) {
	fail("no `allowBuilds` block in the workspace's pnpm-workspace.yaml");
}
writeFileSync(join(site, "pnpm-workspace.yaml"), allowBuilds[0]);

// 4. Install. No lockfile exists, so CI's default frozen lockfile can't apply.
run("pnpm", ["install", "--no-frozen-lockfile"], site);

const installed = realpathSync(join(site, "node_modules/astro-church"));
if (isInside(installed, repo)) {
	fail(
		`astro-church resolves into the workspace (${installed}), not the tarball`,
	);
}

// 5. Check and build.
run("pnpm", ["exec", "astro", "check"], site);
run("pnpm", ["exec", "astro", "build"], site);

// --- Smoke checks --------------------------------------------------------

const page = join(site, "dist", `.${ROUTE}/index.html`);
if (!existsSync(page)) {
	fail(`no page for ${ROUTE} in the packed Site's build (expected ${page})`);
}
if (!readFileSync(page, "utf8").includes(MARKER)) {
	fail(`the ${ROUTE} page doesn't contain the Theme component's ${MARKER}`);
}
console.log(`PASS: ${ROUTE} is built from the packed Theme`);

cpSync(join(testsDir, "import-modules.mjs"), join(site, "import-modules.mjs"));
run("node", ["import-modules.mjs"], site);

rmSync(tempDir, { recursive: true, force: true });
