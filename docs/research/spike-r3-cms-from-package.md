# Research: R-3 spike, CMS served from the package (Astro 7.3.5, tsdown 0.23.0, 2026-11-02) — IN PROGRESS

PRD risk R-3 asks whether Sveltia correctly loads config files injected by the package, plus a separate backend-only file (FR-15, FR-16). Tyler is building the spike on branch `spike/cms-from-package`, from `main` at `dafd42d` (which has the R-1/R-2 dev fixes).

**Status: the core question passes.** Sveltia loads the injected configs and merges `backend` from its own file. Still open: `/cms` in dev, and the scripture field (see [Next step](#next-step)).

## Setup so far
- `src/integration.ts` takes `options: { cms: { repo: string } }`. In `astro:config:setup` it declares `ASTRO_CHURCH_CMS_REPO` (`context: "server"`, `access: "public"`, `default: options.cms.repo`) through `updateConfig({ env: { schema } })`, and injects two prerendered routes with `new URL("./cms/…js", import.meta.url)` entrypoints:
  - `/cms/index.html` → `dist/cms/admin.js`
  - `/cms/config/[file].yaml` → `dist/cms/config.js`
- `src/cms/configs.ts` exports `configs` (trimmed `settings` without `backend`, and trimmed `series`, as YAML template strings, `as const`) and `configKeys = [...Object.keys(configs), "backend"]`. That one list drives both `getStaticPaths` and the admin page's `<link>`s.
- `src/cms/config.ts`: `getStaticPaths` from `configKeys`; `GET` returns `backend:\n  name: github\n  repo: ${ASTRO_CHURCH_CMS_REPO}` for `backend`, `configs[file]` for a key that passes an `isConfigKey` type predicate (`Object.hasOwn(configs, key)`), else 404. `Content-Type: application/yaml`.
- `src/cms/admin.ts`: `GET` returns `sojourners.church`'s `public/cms/index.html` minus the scripture script, with the `<link>`s generated from `configKeys`. Sveltia from unpkg, unversioned (parity).
- `src/env.d.ts` declares `ASTRO_CHURCH_CMS_REPO: string` in `"astro:env/server"`. No `/// <reference>` needed: no exported type depends on the variable (`GET` is an `APIRoute`), and the shipped `.d.ts` files have no `any`.
- Playground: `astroChurch({ cms: { repo: "tmykkanen/astro-church-integration" } })`. No adapter on this branch, so the build is static.

## Results so far

| Check | Result |
|---|---|
| `astro build` | ✅ Exactly `dist/cms/index.html` and `dist/cms/config/{settings,series,backend}.yaml`. `backend.yaml` has the repo from the option. |
| `astro dev`: `/cms/index.html`, `/cms/config/*.yaml` | ✅ 200 with the right `Content-Type` |
| `astro dev`: unknown config (`nope.yaml`, `toString.yaml`) | ✅ 404. Astro checks `getStaticPaths` in dev, so the endpoint's own 404 branch never runs. |
| `astro dev`: `/cms` and `/cms/` | ❌ 404 (see finding 2) |
| Sveltia: Sermon Series (folder collection) and Theme (singleton) | ✅ Both listed and editable |
| Sveltia: `backend` from `backend.yaml` | ✅ No config error. With `backend` removed from `configKeys`, Sveltia shows its missing-backend error. |
| Sveltia: `backend` link first or last | ✅ No difference |
| "Work with Local Repository" from `playground/` | ❌ "The selected folder is not a repository root directory" (finding 3) |

## Finding 1: a missing integration option fails late and unclearly
`astroChurch()` with no options failed the build with `Cannot read properties of undefined (reading 'cms')` in `astro:config:setup`. `astro.config.mjs` is plain JS, so nothing type-checks the call. The options schema (spec step 2) needs a clear error for a missing `cms.repo` (FR-16).

## Finding 2: an endpoint at `/cms/index.html` isn't served at `/cms` in dev
In the build, `dist/cms/index.html` is a plain file, and static hosts (Netlify) serve it at `/cms/`. The dev server matches the pattern literally, so only `/cms/index.html` works. Site Editors and the Theme Author use `/cms`. `integration-capabilities.md` already warned that an endpoint at `/cms` would be written without an extension.

## Finding 3: Sveltia's local repository needs a git root
Sveltia only accepts a folder with `.git`. In this monorepo that's the repo root, so Sveltia resolves `src/content/…` there and writes test content outside `playground/`. Monorepo-only: a real Site's root is its repo root. Don't change the content paths in the config (PRD assumption: content paths stay as they are). Keep the test content Sveltia writes at the repo root out of commits.

## Notes for the spec
- **Entrypoints:** `new URL("./cms/admin.js", import.meta.url)` resolves next to the running `dist/integration.js` and keeps the routes out of `exports` (PRD §9). If the spec points `exports` at `src/` in the workspace (R-1 item 6), these URLs break after publishing; package specifiers or an extension helper would be needed.
- **Where config text lives:** YAML template strings work but aren't how the full config should ship. Options: `.yaml` files copied with tsdown's `copy` and read with `fs` in the prerendered endpoint; `.yaml` kept external and imported with `?raw` (like JSON in `tsdown.config.ts`); or TS objects serialized by the endpoint, possibly typed and checked against the Zod schemas (FR-17).
- **Pin the Sveltia version?** The Theme now owns the CMS (FR-17), so a pinned unpkg URL would make each Theme release reproducible. Kept unversioned for parity.

## Next step
Try an **`.astro` admin page at the pattern `/cms`**, with a `<script>` that imports a stub validator from the package:
- Does `/cms` work in dev and in the build (Astro writes `cms/index.html` itself)?
- Does Astro bundle the field script and the validator with no pre-build step (FR-20)? An endpoint returns a string, so its scripts aren't processed. That's why the scripture field and `/cms` are linked.
- Does `CMS.registerFieldType` run before Sveltia reads the config? Sveltia is a classic script and Astro's scripts are modules (deferred), which is also how `sojourners.church` loads `scriptureField.js` today.
- How does the `.astro` file ship (spec step 1)? tsdown doesn't copy `.astro` files. Try tsdown's `copy` (as in the July spike `astro-church/`), or point the entrypoint at `src/` and note why that breaks once published.

Then: the real `scriptureField.js` and `isValid` from `sojourners.church` (`public/cms/scripts/`, `src/lib/scriptureParsing/isValid.ts`), and write up this note.
