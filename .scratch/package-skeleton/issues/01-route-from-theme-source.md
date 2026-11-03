# 01: The Starter Site renders a route served from the Theme's source

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** FR-1, FR-2 (one route), NFR-1, DX-3 · **ADRs:** 0002, 0005
**Blocked by:** None
**Status:** resolved

## Behaviour

The package ships its source (ADR-0005). The integration injects one `.astro` route that renders a Theme component and uses a `#/` import, and the Starter Site serves it in `astro dev` and `astro build`. This is the tracer bullet the rest of the spec builds on.

## Acceptance criteria

- [x] `exports` has `.` pointing into `src`. tsdown no longer builds the Node code.
- [x] `imports` maps `#/*` to `./src/*`, `#/` imports name the file exactly (`#/integration.ts`; a folder as `…/index.ts`), and the package tsconfig uses `bundler` resolution.
- [x] `"sideEffects": false` is gone, and the peer is `astro ^7.3.0`.
- [x] The route entrypoint comes from `new URL(…, import.meta.url)` and isn't in `exports`.
- [x] The route renders in the Starter Site's dev server and build, and `astro check` passes.
- [x] Risk checked: a `#/` import, both extensionless and a folder import, resolves in Vite and in `tsc`. If either fails, record the fallback to explicit `.ts` in Comments and in the spec. (`tsc` fails, so the fallback applies. See Comments.)

## Public contract

Changes the `astro-church` entry point to source and sets the peer range (NFR-1). Pre-release, so no changeset needed.

## Seams and test list

Seam: built Starter Site (in the workspace).

- [x] The Starter Site builds, and the output contains the route's page with the component's markup
- [x] `tsc --noEmit` passes for the package
      Build and smoke checks: `astro check` and `astro build` in the Starter Site.
      Manual checks: the route in `astro dev`; edit the Theme component and note whether it hot-reloads (input for ticket 08).

## Done when

- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible (not needed: pre-release)
- [x] PRD, ADR, GLOSSARY or README updated if anything changed (no PRD, ADR or GLOSSARY change; the spec and `docs/workflow.md` are updated, see Comments)

## Learning goal (optional)

## Comments

**2026-11-03: `#/` resolution risk check.** Ran in a scratch workspace outside the repo, against Astro 7.3.5, TypeScript 6.0.3 and Node 24. The setup was a source-shipped package with `"#/*": "./src/*"` and `bundler` resolution, and a Site that used its integration. An injected route (entrypoint from `new URL(…, import.meta.url)`) rendered a Theme component that used `#/` imports.

| Import                            | Vite (`astro build`) | `tsc --noEmit` |
| --------------------------------- | -------------------- | -------------- |
| `#/greet` (extensionless file)    | resolves             | TS2307         |
| `#/util` (folder with `index.ts`) | resolves             | TS2307         |
| `#/greet.ts`, `#/util/index.ts`   | resolves             | resolves       |

- **The prefix isn't the cause.** `#src/*` failed the same way. `tsc` doesn't add extensions or `index` files to an `imports` target, even with `bundler` resolution.
- **Considered:** a fallback array (`["./src/*", "./src/*.ts", "./src/*/index.ts"]`). It passed `tsc`, `astro build` and `astro check`, but bare Node still failed (`ERR_MODULE_NOT_FOUND`), because only Vite resolves the paths.
- **Decision (Tyler):** explicit extensions, the ticket's fallback. With the single map and exact paths, `tsc`, `astro build` and the Site's `astro check` passed, and the package imported in bare Node from the workspace.
- **Ported tests:** they import through extensionless or folder `#/` paths (for example `'#/lib/scriptureParsing/'`). Tyler approved one blanket change: add the exact file to those paths, and leave assertions unchanged.
- **Recorded in:** the spec's **Internal alias** decision.

**2026-11-03: build test delegated.** The workflow has Tyler write the first test of each new kind. For this first build test, Tyler delegated it to the agent and approved the draft. The test is `packages/astro-church/tests/build/skeleton-route.mjs`, and its literals are the route `/theme-skeleton` and the marker `data-astro-church="skeleton-component"` in the Theme component. It's a plain Node script that cleans and builds the Starter Site, so ticket 02's harness can reuse it. Red confirmed: the build succeeds, and the test fails on the missing page.

**2026-11-03: package build removed until ticket 07.**

- **Why:** with the Node build gone, tsdown has no entries until the CMS bundle arrives. Checked in a scratch directory: tsdown 0.23.0 exits 1 with `Cannot find entry`.
- **Decision (Tyler):** remove the build rather than add a placeholder entry or a no-op script.
- **Tooling (agent):**
  - pre-push runs `pnpm lint` and `pnpm --filter playground build`
  - CI runs `pnpm lint`, the Starter Site's `astro check` and the build test
  - root `pnpm dev` runs only the Starter Site
  - `package:dev` is gone
  - the Done-when line in tickets 01–08, `docs/workflow.md` and the spec now say "the Starter Site build".
- **Production (Tyler):** remove the package's `build`, `dev` and `prepublishOnly` scripts and `tsdown.config.ts`.
- **Comes back in:** ticket 07 (the bundle build). Ticket 05 switches pre-push and CI to `pnpm verify`.

**2026-11-03: verification.**

| Acceptance criterion                           | Proved by                                                                                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `exports` into `src`; no Node build            | `package.json` change; `tsdown.config.ts` deleted (confirmed at review)                                                                                                                          |
| `imports` map, exact `#/` paths, `bundler`     | `tsc --noEmit` passes (proves `#/integration.ts` in `index.ts`; `tsc` doesn't read `.astro` files); the build test proves the route's `#/components/Skeleton.astro` import resolves through Vite |
| `sideEffects` gone; peer `^7.3.0`              | `package.json` change (confirmed at review)                                                                                                                                                      |
| Entrypoint from `new URL(…)`, not in `exports` | `integration.ts`; `exports` has only `.` (confirmed at review)                                                                                                                                   |
| Renders in dev and build; `astro check` passes | build test passes; `pnpm --filter playground build` passes (`astro check` 0 errors, 0 warnings, 0 hints, but it covers only the Starter Site's own files; see below); manual `astro dev` check   |

- **Break-it check:** a temporary copy of the build test looked for a marker the component doesn't render. It failed on the marker assertion with exit 1, and the copy was deleted. The production component wasn't edited.
- **`tsc` and TypeScript 6:** the first runs borrowed the Starter Site's `tsc`.
  - **Why the editor failed:** it reported TS2307 on `#/integration.ts` while the CLI passed. The repo had no TypeScript at the root, so the editor fell back to its bundled 5.x, and TypeScript 5.9.3 rejects `#/` imports (checked; 6.0.3 accepts them).
  - **Fix (Tyler):** `typescript` 6.0.3 is now a devDependency of the package and of the repo root (the root one so editors find it).
  - **Fix (agent):** `.vscode/settings.json` points VS Code at the workspace TypeScript (`typescript.tsdk`), and CI runs `tsc --noEmit` for the package until ticket 05 replaces it with `pnpm verify`.
  - **Follow-up:** whether Sites need TypeScript ≥ 6 is a risk check in ticket 02.
- **The Theme's `.astro` files aren't typechecked.** The Starter Site's `astro check` covers only the Site's own 6 files, and `tsc` doesn't read `.astro` files. Ticket 05's `pnpm verify` now includes `astro check` with the package as its root.
- **Component renamed** from `skeleton-component.astro` to `Skeleton.astro` at review, to match `sojourners.church`'s PascalCase components. The marker is unchanged.
- **`files` is `["src"]`** until ticket 07 adds `dist` back (spec updated). Tyler also deleted `packages/astro-church/env.d.ts`, which was outside `include` and a non-module `.d.ts`.
- **Lint and formatting:** Tyler turned on Biome's `html.experimentalFullSupportEnabled`, so Biome now lints `.astro` templates.
  - **First flag:** `noRedundantRoles` on `<ul role="list">` in the Starter Site's `src/pages/index.astro`, which is boilerplate from Astro's starter. Tyler removed the attribute.
  - **Formatting gap:** an editor reformat then turned that file's tabs into 2 spaces, unnoticed, because Biome's HTML formatter is off by default.
  - **Fix:** `html.formatter.enabled: true` in `biome.json`, and an Astro entry in `.zed/settings.json` that formats with Biome. Biome re-tabbed the Starter Site's `.astro` files, and `pnpm lint` now checks `.astro` formatting.
  - **Package `tsconfig.json`:** reformatted to tabs.
  - `pnpm lint` passes.
- **Hot reload (input for ticket 08):** with `/theme-skeleton` open in `astro dev`, an edit to the Theme component (then `src/components/skeleton-component.astro`, since renamed `Skeleton.astro`) showed up without restarting the dev server. It was a **full page reload**, not a hot update: with "Preserve log" on, the browser console showed `Navigated to http://localhost:4321/theme-skeleton`. That is expected for a markup edit to a server-rendered `.astro` component. Ticket 08 should also try a `<style>` edit, which may arrive as a hot update.

## Retro

Learned (from the review questions):

- **Route entrypoints:**
  - **Why not a string:** a string like `"astro-church/src/pages/…"` is first resolved as a package import from the Site's root. Node allows that only through `exports`. Because the route isn't in `exports`, Astro silently falls back to a path inside the Site (`ENOENT … playground/astro-church/…`, with no mention of `exports`).
  - **Why `new URL(…, import.meta.url)` works:** it resolves from the integration's own file, wherever the package is installed.
  - **Why it's safe in the integration:** the integration is never bundled, so `import.meta.url` stays reliable there. Route modules are bundled into the Site's `dist/.prerender/` during `astro build`, so `import.meta.url` inside a route works in dev and breaks in the build (R-3 finding 6).
- **`module` and `moduleResolution`:**
  - **`moduleResolution` picks whose resolution rules TypeScript imitates:** `nodenext` for Node, `bundler` for Vite and similar. It isn't about the Node version.
  - **`module` is what TypeScript would output.** `bundler` resolution only works when the output is ES modules (`esnext`) or left as written (`preserve`).
  - **Why `preserve`:** the Site's Vite compiles the Theme's source (ADR-0005), so the package never emits JavaScript, and `tsc` only checks types.
- **What a Site loads:**
  - **The entry point:** `exports` maps `astro-church` to `./src/index.ts`. That works because `files` ships `src`, and because Vite compiles `.ts` from `node_modules` (ticket 02 checks this).
  - **The `#/` paths:** `imports` resolves against the importing file's nearest `package.json`, so the Theme's `#/` is private to the package and can't collide with a Site's own alias.

Surprised by:

- TypeScript 5.x rejects `#/` imports entirely, and the editor quietly used its bundled 5.x because the repo root had no TypeScript.
- Neither `tsc` nor the Starter Site's `astro check` typechecks the Theme's `.astro` files.

Next time:
