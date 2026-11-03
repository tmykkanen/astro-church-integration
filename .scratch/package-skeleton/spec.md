# Spec 3.1: Package skeleton and publishing

**Status:** ready-for-human
**PRD:** FR-1, FR-5 (entry points), FR-6, DX-3, DX-5, NFR-1, NFR-3, §8a.1–3 · **ADRs:** 0002, 0004, 0005
**Decided:** grilling session, 2026-11-03 (Q1–Q16)

## Goal
A walking skeleton of the `astro-church` package. Each way the Theme ships code (TypeScript source, an injected `.astro` route, a component, CSS with Tailwind, a client script, the CMS browser bundle) is proven once in `astro dev`, in `astro build` and in a packed install, before spec 3.4 moves Feature code onto it. This spec also defines `pnpm verify` and the packed-install harness that later specs extend.

## Decisions

### Package shape (ADR-0005)
- **Ship source.** `exports` points into `src/`:
  - `.` → the integration (FR-1)
  - `./content` → `collections` and each collection's schema (R-1 #3; empty in this spec)
  - `./actions` → `server` and the type a Site checks its `server` against with `satisfies` (R-2 #2; empty in this spec)

  There are no other exports: routes, components and styles stay internal.
- **`files`:** `["src", "dist"]`. Tests live outside `src/`, so nothing needs excluding.
- **Internal alias:** `"imports": { "#/*": "./src/*" }`. Imports are extensionless, as in `sojourners.church`, with `moduleResolution: "bundler"` in the package tsconfig. If the first ticket finds that Vite, TypeScript or Vitest doesn't resolve extensionless or directory imports (`#/lib/scriptureParsing/`) through `imports`, fall back to explicit `.ts` imports.
- **Remove `"sideEffects": false`.** Theme CSS imports are side effects, and with source shipped the Site's bundler could drop them silently.
- **Peer `astro ^7.3.0`** (NFR-1's exact minimum). CI tests only the version the Starter Site pins. No version matrix in the MVP.
- **No ambient globals in `src/`:** no `declare global`, and no non-module `.d.ts` files. Types come from imports (env variables from `astro:env`, spec 3.2). A check in `pnpm verify` enforces this.

### Routes
Injected route entrypoints are `new URL("./…", import.meta.url)` from the integration, outside `exports` (R-3 #2). Route modules don't use `import.meta.url`.

### Tailwind (FR-6)
- The Theme's stylesheet declares `@source` for the Theme's own files, with a path relative to the stylesheet. That path still resolves from the pnpm store.
- The Site's content is covered by Tailwind's automatic detection from the project root. The Theme adds nothing for it. If the smoke check shows otherwise, the integration generates an `@source` with an absolute path instead.
- Who adds the Tailwind Vite plugin is spec 3.2 (FR-3). Until then the Starter Site keeps its own.

### CMS browser bundle (R-3 #4, #5)
- One tsdown config. Its entries are in a top-level `client/` folder, and it uses `platform: "browser"`, no explicit `target`, `outDir: "dist/client"`, `deps.alwaysBundle` for the bundle's dependencies, `dts: false`, and the default `clean`.
- The bundle loads only on `/cms` and is editor-only, so it's outside NFR-3.
- `src/lib/scriptureParsing/` moves in from `sojourners.church` unchanged. It's shared by the bundle and, later, the sermon schema and search. `bible-passage-reference-parser` and `bible-reference-formatter` go in `dependencies`.
- `prepublishOnly` builds the bundle.

### Tests
- Ported tests live in `packages/astro-church/tests/`, mirroring `sojourners.church`'s `tests/` (§8a.1). Vitest is the runner.
- The first ported test is `tests/lib/scriptureParsing.test.ts`, unchanged.

### Dev loop (DX-5, R-4)
- Root `pnpm dev`: build the bundle once, then run `tsdown --watch --no-clean` (bundle only) and the Starter Site's `astro dev` in parallel.
- The package README's contributing section gets a reload table. It records what reaches a running `astro dev` for each kind of edit:
  - a Theme component
  - CSS
  - the integration
  - collections
  - actions
  - saving the Site's `src/actions/index.ts` after a Theme action edit (R-2 leftover)
  - the rebuilt bundle (R-3 leftover)

### `pnpm verify`
Runs, in order:
1. Biome
2. `tsc --noEmit` for the package (R-2 #5)
3. the no-globals check
4. Vitest
5. the bundle build
6. `astro check` and `astro build` for the Starter Site

The packed-install harness isn't part of `verify`; it runs in CI.

### Packed-install harness (§8a.3)
- A script runs `pnpm pack`, installs the tarball into a temporary copy of the Starter Site outside the workspace, then runs `astro check`, `astro build` and the smoke checks.
- A CI job runs it on every PR from this spec on.
- Later specs add checks: `/cms` and the config files in 3.5; Feature routes, the URL set and the Netlify build in 3.7.

## Walking skeleton
What exists when this spec is done (Tyler names and shapes all of it):
- The integration injects one `.astro` route. The route renders a Theme component, uses a `#/` import, applies a Tailwind class that appears only in Theme files, and includes a client `<script>`.
- The Starter Site has one content file using a Tailwind class that appears nowhere else.
- `astro-church/content` exports an empty `collections`, and `astro-church/actions` exports an empty `server` plus its `satisfies` type. The Starter Site re-exports both in one line each (DX-1).
- `client/` holds the scripture field's validator entry, bundled to `dist/client/`.

## Test seams (approved 2026-11-03)
1. **Packed-install harness** (built Starter Site):
   - `astro check` passes.
   - A type probe asserts that the re-exported `collections`, `server` and `satisfies` type aren't `any` (DX-3). The check that a collection entry's `data` isn't `any` (R-1 #1) moves to spec 3.3, because `collections` is empty here.
   - The built CSS contains both the Theme-only and the content-only Tailwind classes.
   - The skeleton route renders.
   - Every shipped module imports (R-3 #9).
   - No test files are in the tarball.
2. **Vitest:** the ported `scriptureParsing.test.ts`, unchanged.
3. **No-globals check** over `src/`.
4. **Manual:** the dev reload table.

## Tickets
`issues/01`–`08`, approved 2026-11-03.

## Risks for the first ticket
- `#/` resolution through `imports` (extensionless and directory imports) in Vite, TypeScript and Vitest.
- Astro running the packed package through Vite (`noExternal`), so `.ts` from `node_modules` compiles.
- Vitest in the package: `sojourners.church` uses `getViteConfig` from `astro/config`, and the package has no Astro config.

## Carried items
| Item | Outcome |
|---|---|
| R-1 #1 `types: ["astro/client"]`, `any` in `.d.ts` | Not needed (no `.d.ts`). The type probe covers the risk; its entry-`data` check moves to 3.3. |
| R-1 #5, R-2 #7 Astro paths in shipped types | Not needed (no `.d.ts`). |
| R-1 #6, R-2 #8 dev loop | Replaced by the dev loop above. |
| R-2 #5 `tsc --noEmit` in CI | In `pnpm verify`. |
| R-2 #4 ambient `env.d.ts` | Moved to 3.2, under the no-globals rule. |
| R-3 #2 route entrypoints | Decided above. |
| R-3 #4 two tsdown configs | One config (browser only). |
| R-3 #5 `scriptureParsing` | Moves in during this spec. |
| R-3 #9 packed-tarball check | The harness, with the module-import check. |
| Packed package, `pnpm dev` watcher (spike leftovers) | The harness and the reload table. |

## Out of scope
- Feature code (3.4).
- Integration options, `env.schema`, fonts and bundled integrations (3.2).
- Collections and schemas, and R-6 cache busting (3.3).
- Serving `/cms` (3.5).
- Customization (3.6).
- Netlify, generic sample content and Starter Site smoke checks beyond the skeleton (3.7).
