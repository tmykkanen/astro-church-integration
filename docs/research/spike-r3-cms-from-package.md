# Research: R-3 spike, CMS served from the package (Astro 7.3.5, tsdown 0.23.0, Sveltia CMS from unpkg, 2026-11-02)

PRD risk R-3 asks whether Sveltia correctly loads config files injected by the package, plus a separate backend-only file (FR-15, FR-16). Tyler built the spike on branch `spike/cms-from-package`, from `main` at `dafd42d`. It grew to cover the whole of FR-15: the admin page at `/cms`, the config files, and the scripture field with its real validator, all with no pre-build step in the Site (FR-20).

**Verdict: R-3 passes.** Sveltia loads the admin page, the field configs and `backend` from injected routes, and the scripture field runs the real parser. This works in `astro dev` and in `astro build`, and the Site's only CMS setting is `cms.repo` (FR-16). The design that works is narrower than `integration-capabilities.md` suggested. Seven findings shape it:
1. A missing integration option fails late and unclearly.
2. An endpoint can't serve the admin page at `/cms` in both dev and the build. A pattern that switches on `command` fixes it.
3. Sveltia's local repository needs a git root, so in this monorepo it writes outside `playground/`.
4. An `.astro` admin page is unsafe in dev: Sveltia warns about it, because Vite's client can reload the page mid-save.
5. A bare-specifier entrypoint that isn't in `exports` silently resolves against the Site's root.
6. `import.meta.url` inside a route module points into the Site's build folder during `astro build`.
7. tsdown doesn't catch a missing runtime dependency.

**Not done:** a build with `@astrojs/netlify`, the published (non-symlinked) package, and R-4 through the package's own watcher. See [Still open](#still-open).

## Setup (final state of the branch)
- **Option:** `integration(options: { cms: { repo: string } })`. In `astro:config:setup` it declares `ASTRO_CHURCH_CMS_REPO` (`context: "server"`, `access: "public"`, `default: options.cms.repo`) through `updateConfig({ env: { schema } })`. `src/env.d.ts` declares it for `astro:env/server`.
- **Three prerendered routes**, each with a `new URL("./cms/….js", import.meta.url)` entrypoint:

  | Pattern | Module | Returns |
  |---|---|---|
  | `/cms` in dev, `/cms/index.html` in build (switches on `command`) | `cms/admin.ts` | The admin page as an HTML string: one `<link rel="cms-config-url">` per config key, Sveltia as a classic `<script src>` from unpkg (unversioned, for parity), then `<script type="module" src="/cms/scripts/scriptureField.js">` |
  | `/cms/config/[file].yaml` | `cms/config.ts` | `getStaticPaths` from `configKeys`. `backend` is built from `ASTRO_CHURCH_CMS_REPO`; other keys come from `configs` (YAML template strings, `as const`), guarded by an `Object.hasOwn` type predicate |
  | `/cms/scripts/scriptureField.js` | `cms/scripts.ts` | The browser bundle, imported with `?raw`, as `text/javascript` |

- **`configKeys = ["backend", ...Object.keys(configs)]`** drives both the admin page's `<link>`s and `getStaticPaths`. The configs are trimmed `settings` (a Theme singleton, no `backend`) and trimmed `series`, with a `widget: scripture` field added.
- **The field:** `src/cms/scriptureField.ts` is a port of `sojourners.church`'s `public/cms/scripts/scriptureField.js`. It imports `isValidScriptureRef` from `src/lib/scriptureParsing/`, which was copied from `sojourners.church` with relative `.ts` imports in place of the `#/` alias. `src/cms/sveltia.d.ts` declares the globals Sveltia provides (`CMS`, `createClass`, `h`). It isn't a module, so they're global across the package.
- **Dependencies:** `bible-passage-reference-parser` and `bible-reference-formatter` in `dependencies`, and `@types/bible-reference-formatter` in `devDependencies` (the versions match `sojourners.church`).
- **tsdown:** `defineConfig([...])` with two configs:
  - **Node** (as before): unbundled. It excludes `src/cms/scriptureField.ts` from `entry` and adds `/\?raw$/` to `neverBundle`.
  - **Browser:** `entry: ["src/cms/scriptureField.ts"]`, `platform: "browser"`, `unbundle: false`, `dts: false`, `outDir: "dist/client"`, and `deps.alwaysBundle` for the two parser paths with `onlyBundle: false` (copied from `sojourners.church`'s own `tsdown.config.ts`).
- **Playground:** `astroChurch({ cms: { repo: "tmykkanen/astro-church-integration" } })`. There's no adapter on this branch, so the build is static.

## Results

| Check | Result |
|---|---|
| `astro build` output | ✅ Exactly `dist/cms/index.html`, `dist/cms/config/{backend,settings,series}.yaml` and `dist/cms/scripts/scriptureField.js`. `backend.yaml` has the repo from the option. |
| Served bundle matches the package's | ✅ `dist/cms/scripts/scriptureField.js` is byte-for-byte `packages/astro-church/dist/client/scriptureField.js` |
| `/cms`, `/cms/`, `/cms/index.html` | ✅ 200 in `astro dev` and in `astro preview` |
| Config routes in dev | ✅ 200 with the right `Content-Type`. Unknown keys (`nope.yaml`, `toString.yaml`) return 404: Astro checks `getStaticPaths` in dev, so the endpoint's own 404 branch never runs. |
| Script route in dev | ✅ 200, `text/javascript; charset=utf-8` |
| `astro check` in the playground | ✅ 0 errors, 0 warnings, 0 hints |
| Sveltia: Sermon Series (folder collection) and Theme (singleton) | ✅ Both listed and editable |
| Sveltia: `backend` from its own file | ✅ No config error. With `backend` removed from `configKeys`, Sveltia shows its missing-backend error. Link order (first or last) makes no difference. |
| Scripture field, inline in the page (ordering probe) | ✅ A `type="module"` script after Sveltia's classic script registers the field before the config loads |
| Scripture field with the stub validator, then the real parser | ✅ "John 3:16" saves, "Hezekiah 4" shows the field's error |
| Browser bundle | ✅ 265 kB (39 kB gzip), 9,937 lines, no imports. This matches today's `isValid.mjs` + `scriptureField.js` (9,913 + 29 lines). It loads only on `/cms`, so NFR-3 (public pages) is unaffected. |
| Node build | ✅ `dist/lib/scriptureParsing/parser.js` still imports the parser, unbundled |
| Sveltia warning in dev | ✅ None with the endpoint page. ⚠️ Shown with an `.astro` page (finding 4). |
| "Work with Local Repository" from `playground/` | ❌ "The selected folder is not a repository root directory" (finding 3) |
| R-4: rebuilt bundle reaches a running `astro dev` | ✅ In a scratch copy, after a manual `tsdown --no-clean`, without a restart. Not checked through `pnpm dev`'s watcher. |

## Finding 1: a missing integration option fails late and unclearly
`astroChurch()` with no options failed the build with `Cannot read properties of undefined (reading 'cms')` in `astro:config:setup`. `astro.config.mjs` is plain JS, so nothing type-checks the call. The options schema (spec step 2) needs a clear error for a missing `cms.repo` (FR-16).

## Finding 2: no single endpoint pattern works for `/cms` in dev and the build
| Endpoint pattern | `astro dev` `/cms` | `astro build` |
|---|---|---|
| `/cms/index.html` | ❌ 404: the dev server matches the pattern literally | ✅ `dist/cms/index.html`, which static hosts serve at `/cms/` |
| `/cms` | ✅ | ❌ `EISDIR: illegal operation on a directory, open '…/dist/cms'`: Astro adds no extension to an endpoint's output, and `dist/cms/` already exists for the config files |

This confirms the gotcha in `integration-capabilities.md`. **The fix:** `pattern: command === "dev" ? "/cms" : "/cms/index.html"`, using the `command` that `astro:config:setup` receives. All three URLs (`/cms`, `/cms/`, `/cms/index.html`) then return 200 in dev and in `astro preview`.

## Finding 3: Sveltia's local repository needs a git root
Sveltia only accepts a folder with `.git`. In this monorepo that's the repo root, so Sveltia resolves `src/content/…` there and writes test content outside `playground/` (it wrote `src/content/series/test.md` at the root during this spike). This only affects the monorepo: a real Site's root is its repo root. Don't change the content paths in the config (PRD assumption: content paths stay as they are). Keep the test content Sveltia writes at the repo root out of commits.

## Finding 4: an `.astro` admin page is unsafe in dev
The plan was an `.astro` page at `/cms`: Astro writes `cms/index.html` itself, and it bundles the page's `<script>`s. Both worked. The `.astro` file shipped through tsdown's `copy` (`{ from: "src/pages/*.astro", flatten: false }`), Sveltia stayed classic with `is:inline`, and `/cms` returned 200 in dev and the build.

**The catch:** in dev, Astro serves every rendered page through Vite and adds Vite's HMR client. Sveltia detects that client and shows a warning linking to its [local workflow troubleshooting](https://sveltiacms.app/en/docs/workflows/local#troubleshooting): "Load Sveltia CMS from a static HTML file … Don't load it from a page rendered by your framework", naming `/src/pages/admin.astro`. In local-repo mode, a reload triggered by Sveltia's own write into `src/content/` "can interrupt saving and leave a file empty or a temporary `.sveltia-tmp-*` file behind". The endpoint page gets no Vite client and shows no warning.

Builds aren't affected (the built page is plain HTML), and this monorepo hides the reload because of finding 3. A real Site's Theme Author or Site Developer using the local repository in dev would hit it.

**Consequence:** the admin page stays an endpoint returning a string. Astro doesn't process scripts in a string, so the field script has to be built by the package and served separately (finding 6 covers how).

## Finding 5: a bare-specifier entrypoint not in `exports` resolves against the Site
`entrypoint: "astro-church/pages/admin.astro"` failed with `ENOENT … playground/astro-church/pages/admin.astro`. Astro's `resolveInjectedRoute` (`astro/dist/core/routing/create-manifest.js:666`) tries `require.resolve(entrypoint)` from the Site's root, and on any error falls back to `new URL(entrypoint, root)`. Node's resolution honors only the package's `exports`, which had no matching entry, so the specifier became a path inside the Site and the error doesn't mention `exports`.

`new URL("./pages/admin.astro", import.meta.url)` from `dist/integration.js` worked, and keeps route files out of `exports` (PRD §9). The integration itself is never bundled, so `import.meta.url` is reliable there.

## Finding 6: `import.meta.url` inside a route module isn't reliable in the build
The first `scripts.ts` read `new URL("../client/scriptureField.js", import.meta.url)` with `readFile`. It worked in dev, where Vite loads the endpoint from `packages/astro-church/dist/cms/`. `astro build` failed:

```
ENOENT … playground/dist/.prerender/client/scriptureField.js
```

During the build, Astro bundles route modules into chunks under the Site's `dist/.prerender/`, so `import.meta.url` points there. `config.ts` never hit this because it reads nothing from disk.

**Two fixes, both tested in a scratch copy:**

| | A: `import body from "../../dist/client/scriptureField.js?raw"` | B: the integration resolves the path and passes it with `vite.define` |
|---|---|---|
| `astro build` (byte-for-byte output) | ✅ | ✅ |
| dev: 200, `text/javascript` | ✅ | ✅ |
| dev: picks up a rebuilt bundle without a restart | ✅ | ✅ |
| Code | 1 import, plus `/\?raw$/` in `neverBundle` | `define` in `integration.ts`, a `declare const` global, `readFile` |

**Chosen: A.** Vite reads the file when it loads the endpoint, so the bundling doesn't matter, and no absolute path from the build machine is baked into a chunk. B works too.

Details of A:
- **Without `/\?raw$/` in `neverBundle`, the package build fails** (`No such file or directory` at the import). Rolldown tries to resolve the import itself; it doesn't support `?raw`, and the shared clean has already emptied `dist/`. With the entry, the import passes through untouched to `dist/cms/scripts.js`, and Vite in the Site resolves it.
- **The path isn't rewritten,** so it has to be correct from `dist/cms/`. `../../dist/client/…` resolves from both `src/cms/` and `dist/cms/` only because they're at the same depth. It's convenient but fragile.
- **The types** come from `astro/client` (`*?raw`), which the package's tsconfig already includes.

## Finding 7: tsdown doesn't catch a missing runtime dependency
`parseScriptureRef.ts` imported `bible-reference-formatter` before it was installed, and `tsdown` still built: in unbundled mode an import it can't resolve is left external. It would have failed the first time anything imported `parseScriptureRef` at runtime. Only a build or run against the packed tarball (PRD §8a) catches this.

## Other results
- **Two tsdown configs clean once.** With `defineConfig([...])`, tsdown runs one shared clean of every config's `clean` list before any config builds (`build-JVmLFaZt.mjs:740–796`), so the browser config can't wipe the Node output in `dist/`. Two builds in a row kept every file. In watch mode, each config removes only its own stale chunks.
- **`unbundle` and `deps` are per config.** The Node config stays unbundled with the parser external. The browser config needs `deps.alwaysBundle` for the parser, because tsdown treats `dependencies` as external by default, including for `platform: "browser"`.
- **The bundle contains one false alarm.** Line 4594 of the bundle is `import * as lang from "esm/lang/en.js"`, but it sits inside an error-message string in `bcv_parser.js`. Today's `isValid.mjs` has the same line.
- **The globals file is global.** `sveltia.d.ts` makes `CMS`, `createClass` and `h` type-check anywhere in `src/`, including server code.
- **YAML parsing follows the `<link>`.** Sveltia parses each config by the `<link type>` attribute, not the response `Content-Type` (`integration-capabilities.md`). The endpoint sends `application/yaml` anyway.

## Still open
- **Netlify:** one `astro build` with `@astrojs/netlify` (NFR-2), checking that `/cms/` serves `cms/index.html` and that the injected prerendered routes deploy as static files.
- **The published package:** `?raw` and the `new URL` entrypoints against a real folder in `node_modules`, not a workspace symlink, in the packed-tarball build (PRD §8a). Also how both interact with R-1 item 6 (`exports` → `src` in the workspace): the entrypoints point at `dist/` files, and the `?raw` path is `dist`-relative.
- **R-4 through `pnpm dev`:** does `tsdown --watch --no-clean` rebuild `dist/client/scriptureField.js` when `lib/scriptureParsing/isValid.ts` changes, and does a running `astro dev` then serve it? The scratch test only used a manual rebuild.
- **The `.astro` reload in a real Site:** finding 4 is from Sveltia's docs and its warning. The reload itself wasn't reproduced, because of finding 3.

## Carried into the spec
1. **Admin page:** an endpoint returning an HTML string, never an `.astro` page (finding 4). The pattern switches on `command`: `/cms` in dev, `/cms/index.html` in the build (finding 2).
2. **Route entrypoints:** `new URL("./…", import.meta.url)` from the integration, out of `exports` (finding 5). Don't use `import.meta.url` inside route modules (finding 6).
3. **Files a route serves** (the field bundle, and probably the full YAML configs) are imported with `?raw`, with `/\?raw$/` in the Node config's `neverBundle`. Decide whether real `.yaml` files with `?raw` replace the template strings; it would also let FR-17's schema check read the same files. Note the `dist`-relative path.
4. **Two tsdown configs:** Node (unbundled) and browser (one bundled entry per field script, `deps.alwaysBundle` for its dependencies, `dts: false`, `outDir: "dist/client"`). Leave `clean` at its default in both. Decide whether the browser config needs a `target`.
5. **`src/lib/scriptureParsing/`** moves in once and serves both builds. The CMS field and, later, the sermon schema and search filter import it. `bible-passage-reference-parser` and `bible-reference-formatter` go in `dependencies` (finding 7).
6. **Public URLs:** `/cms`, `/cms/config/<key>.yaml` and `/cms/scripts/scriptureField.js`. Decide whether any of them are part of the public contract (PRD §9). Editors bookmark `/cms`; the others are internal to the Theme.
7. **The options schema** gives a clear error for a missing `cms.repo` (finding 1, spec step 2).
8. **Pin the Sveltia version?** The Theme owns the CMS (FR-17), so a pinned unpkg URL would make each Theme release reproducible. Kept unversioned for parity, so pinning would be a deliberate change.
9. **The packed-tarball smoke check** (PRD §8a) builds `/cms`, the configs and the script, and imports every shipped module, so a missing runtime dependency (finding 7) or a broken `?raw` path fails CI.
10. **Monorepo dev:** Sveltia's local repository can't be used from `playground/` (finding 3). The Starter Site spec decides whether that matters, for example by testing the CMS locally from a separate checkout.
