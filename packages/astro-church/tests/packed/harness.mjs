// Packed-install harness (ticket 02, spec 3.1): packs the package and checks
// the tarball ships no test code and exactly the CMS field bundle in `dist/`
// (ticket 07). It installs the tarball into a copy of the Starter Site
// outside the workspace and checks the installed bundle has no imports and
// registers the scripture field (ticket 07). Then it runs `astro check`
// (including the type probe in `fixtures/`, ticket 04) and `astro build`,
// and the smoke checks: the route renders, its page loads the Theme-only and
// Site-content Tailwind classes and the route's client script (ticket 03),
// its CSS sets the Theme's font and the font files it preloads are built
// (ticket 02, spec 3.2), and every shipped module imports. Ticket numbers
// without a spec are spec 3.1's.
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
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Literals the Theme must produce (same as tests/build/skeleton-route.mjs).
const ROUTE = "/theme-skeleton";
const MARKER = 'data-astro-church="skeleton-component"';

// Tailwind classes that appear in exactly one place each (ticket 03): the
// Theme-only class in Theme files under `src/`, nowhere in the Starter Site.
const THEME_CLASS = "decoration-wavy";
// The content-only class appears in one Starter Site content file, nowhere in
// the Theme. It must reach the Theme route's CSS, not just the Site's own
// stylesheet: that shows the Theme's Tailwind detects Site content (FR-6).
const CONTENT_CLASS = "decoration-dotted";
// A string literal in the route's client <script>. Minifiers keep string
// literals the script uses, so finding it in the JS the page loads shows the
// script shipped.
const SCRIPT_MARKER = "astro-church:skeleton-script";

// The Theme's font (ticket 02, spec 3.2): the CSS variable the integration
// registers it under, and its family name.
const FONT_VARIABLE = "--font-sans";
const FONT_FAMILY = "Poppins";

// The CMS field's browser bundle (ticket 07), built from
// `client/scriptureField.ts`. The path is relative to the package root.
const BUNDLE = "dist/client/scriptureField.js";

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

// Smoke check (ticket 07): the tarball's `dist/` is exactly the CMS field's
// browser bundle, which `prepack` builds. Nothing serves it yet (spec 3.5).
// Anything else there (a stray entry, a chunk, a `.d.ts`) fails the check.
const shippedDist = tarEntries.filter((entry) =>
	entry.startsWith("package/dist/"),
);
const expectedDist = [`package/${BUNDLE}`];
if (
	shippedDist.length !== expectedDist.length ||
	!expectedDist.every((entry) => shippedDist.includes(entry))
) {
	fail(
		`the tarball's dist/ should be exactly ${BUNDLE}, found:\n  ${shippedDist.join("\n  ") || "(nothing)"}`,
	);
}
console.log(`PASS: the tarball's dist/ is exactly the CMS field bundle`);

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

// Add the type probe (ticket 04), so step 5's `astro check` fails if a
// re-exported entry point's type is `any`.
cpSync(
	join(testsDir, "fixtures/type-probe.ts"),
	join(site, "src/type-probe.ts"),
);

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

// Smoke check (ticket 07): the installed bundle imports nothing, so Sveltia's
// page can load it as one script: no static `import`, no `export … from`, no
// dynamic `import()`. A text search isn't enough: the bundled parser has an
// error message whose text contains an import statement. es-module-lexer
// (what Vite and Astro use to find imports) skips strings and comments. It
// isn't our dependency, so load Astro's copy, as `import-modules.mjs` loads
// Vite. If Astro drops it, add it to the root devDependencies.
const fromAstro = createRequire(
	realpathSync(join(site, "node_modules/astro/package.json")),
);
const lexer = await import(
	pathToFileURL(fromAstro.resolve("es-module-lexer")).href
);
await lexer.init;
const bundleSource = readFileSync(join(installed, BUNDLE), "utf8");
const [bundleImports] = lexer.parse(bundleSource, BUNDLE);
// `import.meta` is an expression, not an import; the lexer lists it too.
const realImports = bundleImports.filter(
	(found) => found.t !== lexer.ImportType.ImportMeta,
);
if (realImports.length > 0) {
	const shown = realImports.map((found) => {
		const line = bundleSource.slice(0, found.ss).split("\n").length;
		return `line ${line}: ${bundleSource.slice(found.ss, found.se)}`;
	});
	fail(
		`the CMS field bundle ${BUNDLE} has ${realImports.length} import(s):\n  ${shown.join("\n  ")}`,
	);
}
console.log(`PASS: the CMS field bundle has no imports`);

// Smoke check (ticket 07): the installed bundle registers the scripture field
// and validates with the real parser. A separate process keeps its stub
// globals out of this one.
run(
	"node",
	[join(testsDir, "register-validator.mjs"), join(installed, BUNDLE)],
	site,
);

// 5. Check and build.
run("pnpm", ["exec", "astro", "check"], site);
run("pnpm", ["exec", "astro", "build"], site);

// --- Smoke checks --------------------------------------------------------

// With an adapter, prerendered pages and assets go to dist/client/.
const client = join(site, "dist", "client");
const page = join(client, `.${ROUTE}/index.html`);
if (!existsSync(page)) {
	fail(`no page for ${ROUTE} in the packed Site's build (expected ${page})`);
}
if (!readFileSync(page, "utf8").includes(MARKER)) {
	fail(`the ${ROUTE} page doesn't contain the Theme component's ${MARKER}`);
}
console.log(`PASS: ${ROUTE} is built from the packed Theme`);

const pageHtml = readFileSync(page, "utf8");

// A file the route's page references by URL, read from the build. `tag` is
// the referencing tag, for the failure message.
function readBuilt(url, tag) {
	const file = url && join(client, url);
	if (!file || !existsSync(file)) {
		fail(`the ${ROUTE} page references a file that isn't built: ${tag}`);
	}
	return readFileSync(file, "utf8");
}

// The CSS the route's page loads: linked stylesheets from the build, plus any
// stylesheet Astro inlined into a <style> tag.
const routeCss = [
	...[...pageHtml.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map(
		([tag]) => readBuilt(tag.match(/\bhref="([^"]+)"/)?.[1], tag),
	),
	...[...pageHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(
		([, css]) => css,
	),
].join("\n");

// The JS the route's page loads: scripts it links from the build, plus any
// script Astro inlined into the page.
const routeJs = [
	...pageHtml.matchAll(/(<script\b([^>]*)>)([\s\S]*?)<\/script>/g),
]
	.map(([, tag, attrs, body]) => {
		const src = attrs.match(/\bsrc="([^"]+)"/)?.[1];
		return src ? readBuilt(src, tag) : body;
	})
	.join("\n");

// A rule for the class's own selector, not a longer class it prefixes.
function hasClassRule(css, className) {
	const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`\\.${escaped}(?![\\w-])`).test(css);
}

if (!hasClassRule(routeCss, THEME_CLASS)) {
	fail(
		`the ${ROUTE} page's CSS has no rule for the Theme-only class .${THEME_CLASS}`,
	);
}
console.log(`PASS: the ${ROUTE} page's CSS has the Theme-only .${THEME_CLASS}`);

if (!hasClassRule(routeCss, CONTENT_CLASS)) {
	fail(
		`the ${ROUTE} page's CSS has no rule for the Site content class .${CONTENT_CLASS}`,
	);
}
console.log(
	`PASS: the ${ROUTE} page's CSS has the Site content class .${CONTENT_CLASS}`,
);

if (!routeJs.includes(SCRIPT_MARKER)) {
	fail(
		`the ${ROUTE} page's JS doesn't contain the route script's "${SCRIPT_MARKER}"`,
	);
}
console.log(`PASS: the ${ROUTE} page ships the route's client script`);

// Smoke check (ticket 02, spec 3.2): the route's CSS sets the font variable to
// the Theme's font. Astro's <Font /> declares it with a hashed family name,
// such as `--font-sans:Poppins-82fd…,"Poppins-82fd… fallback: Arial",…`.
// Tailwind's theme can declare --font-sans too (a system font stack), so the
// check needs the family in the value, not just the variable.
if (!new RegExp(`${FONT_VARIABLE}\\s*:[^;}]*${FONT_FAMILY}`).test(routeCss)) {
	fail(
		`the ${ROUTE} page's CSS doesn't set ${FONT_VARIABLE} to ${FONT_FAMILY}`,
	);
}
console.log(
	`PASS: the ${ROUTE} page's CSS sets ${FONT_VARIABLE} to ${FONT_FAMILY}`,
);

// Smoke check (ticket 02, spec 3.2): the font files the route preloads are in
// the build. Astro emits the configured font's files whether or not a page
// renders <Font />, so "the build has font files" passes before the route
// renders anything. This check ties the files to the route: <Font preload />
// adds a <link rel="preload" as="font"> per file, and each must be built.
const fontUrls = [...pageHtml.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/g)]
	.map(([tag]) => tag)
	.filter((tag) => /\bas="font"/.test(tag))
	.map((tag) => tag.match(/\bhref="([^"]+)"/)?.[1]);
if (fontUrls.length === 0) {
	fail(`the ${ROUTE} page preloads no font files`);
}
const missingFonts = fontUrls.filter(
	(url) => !url || !existsSync(join(client, url)),
);
if (missingFonts.length > 0) {
	fail(
		`the ${ROUTE} page preloads font files that aren't built:\n  ${missingFonts.join("\n  ")}`,
	);
}
console.log(
	`PASS: the ${fontUrls.length} font files the ${ROUTE} page preloads are built`,
);

cpSync(join(testsDir, "import-modules.mjs"), join(site, "import-modules.mjs"));
run("node", ["import-modules.mjs"], site);

rmSync(tempDir, { recursive: true, force: true });
