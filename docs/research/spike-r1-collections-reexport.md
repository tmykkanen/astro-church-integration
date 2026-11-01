# Research: R-1 spike, collections re-export (Astro 7.3.5, tsdown 0.23.0, 2026-11-01)

PRD risk R-1 and ADR-0004 ask whether a Site can re-export a complete `collections` object defined in the package, in dev and in build, with types. Tyler built the spike on branch `spike/collections-reexport`. The spike also produced most of the evidence for R-4 (dev reload) so far.

**Verdict: R-1 passes, and ADR-0004 stands, with conditions.** Re-exporting works in build, in dev and in the types. Spreading and overriding works. The conditions are four findings the spec has to carry:
1. The package's declaration build needs ambient Astro types, or every shipped type is `any`.
2. Theme schema changes don't invalidate a Site's content cache. The spike found and tested a fix.
3. A Site can't extend a Theme schema through the finished `collections` object. Decided: the package also exports its schemas.
4. Package edits don't reach a running dev server (R-4).

## Setup
- `packages/astro-church/src/content.ts` builds one collection with `defineCollection` (from `astro:content`), `glob` (from `astro/loaders`) and `z` (from `astro/zod`): `glob({ pattern: "test.yaml", base: "./src/content" })`, schema `{ title: string, subtitle?: string }`. It exports `collections`.
- The package exports `./content` as `{ types: ./dist/content.d.ts, default: ./dist/content.js }`, the same shape as `.`.
- `playground/src/content.config.ts` was first the one line from ADR-0004 (`export { collections } from "astro-church/content";`), then the spread-and-override form (below).
- The playground has `src/content/test.yaml` and an index page that calls `getCollection("testCollection")`.
- **Type probe:** a file outside the repo, type-checked with `tsc` against the playground's `tsconfig` and `.astro/types.d.ts`. It includes a deliberate error (`const n: number = "x"`) to show the check really runs, plus assertions about the type of `getCollection(...)[0].data`.

## Results

| Check | Result |
|---|---|
| `astro sync` | ✅ Syncs content and generates the collection in `.astro/content.d.ts`. |
| `astro check` + `astro build` (from a clean `.astro/`) | ✅ Both pass, and the page gets the entry. |
| `astro dev` | ✅ Serves the entry. Site content edits reload. |
| Entry types in the Site | ✅ After the `tsconfig` fix: `data` is `{ title: string; subtitle?: string }`. Before it: `any`. |
| Spread, override and add | ✅ At runtime and in the types. |
| Extending a Theme schema from `collections` | ❌ Fights the types. Decided: export schemas separately. |
| Theme schema change with a cached content store | ❌ Not revalidated. ✅ With the version in `env.schema`. |
| Package edits during `astro dev` (R-4) | ❌ Reach the editor, not the running server. |

### `glob` `base` resolves against the Site's project root
`base: "./src/content"` inside the package found `playground/src/content/test.yaml`, and the stored `filePath` is `src/content/test.yaml`. The Theme can keep the content paths `sojourners.church` already uses.

It resolves against the **project root, not `srcDir`**. A Site that sets `srcDir` would silently load nothing. Starlight resolves its paths against `srcDir`: its `docsLoader()` wraps `glob(...).load(context)` and computes `base` from `context.config` (`starlight/src/loaders.ts`, `src/utils/collection.ts`). Spec question: support custom `srcDir` with a loader wrapper like that, or state that it isn't supported. PRD §10 parity makes "not supported" defensible.

### The built package compiles cleanly
`dist/content.js` keeps `astro:content`, `astro/loaders` and `astro/zod` as external imports, and Vite resolves them in the Site.

## Finding 1: shipped types were `any`

**Symptom:** with the export pointing at `dist/`, the probe found `getCollection("testCollection")[0].data` was `any`, so `data.title` as a number and `data.nope` both passed. `astro check` passed too, because `any` accepts everything. With the export pointing at `src/content.ts`, the types were right, because TypeScript read the source.

**The chain:** `.astro/content.d.ts` builds entry types from `typeof import("../src/content.config.js")`. That re-exports `astro-church/content`, which resolves to `dist/content.d.ts`. tsdown had emitted `export declare const collections: { testCollection: any }`. Astro infers entry types from the declared type of `collections`, not from the runtime schema.

**The cause:** `astro:content` is a virtual module. Inside the package its types come only from `env.d.ts` (`/// <reference types="astro/client" />`). tsdown's declaration build only loads the entry files, so it never sees `env.d.ts`. `astro:content` then doesn't resolve, and the emitter writes `any` without raising an error. This was reproduced with `tsc`: full type with `env.d.ts` in the program, `any` without it.

**The fix (applied on the spike branch):** `"types": ["astro/client"]` in the package's `tsconfig.json` `compilerOptions`. tsdown now emits:

```ts
import { z } from "astro/zod";
export declare const collections: {
  testCollection: import("astro/content/config").CollectionConfig<z.ZodObject<{
    title: z.ZodString;
  }, z.core.$strip>, import("astro/loaders").Loader>;
};
```

After a clean rebuild, `astro check` passes with 0 errors and the probe sees `data` as typed: wrong uses error.

**For the spec:**
- The setting covers every `astro:*` import. `astro:actions` (R-2) and `astro:env` would otherwise hit the same problem.
- Add a CI or smoke check that the shipped `.d.ts` files contain no stray `any`. `astro check` can't catch this regression.
- **Public contract (PRD §9):** the emitted declaration names `astro/content/config`, which Astro doesn't document (see `integration-capabilities.md`). It resolves from the Site's own `astro`, since `astro` is a peer, but a rename in an Astro minor would break Theme types. Either accept that and pin the tested range, or annotate `collections` with public types.

## Finding 2: Theme schema changes don't invalidate the content cache

**Symptom:** with `subtitle` made required in the package and absent from `test.yaml`, `astro dev`, a restart of `astro dev` and `astro build` all passed. Only `astro build --force` (or `astro sync`) failed with `InvalidContentEntryDataError … subtitle: Required`.

**The mechanism (Astro 7.3.5 source):**
- The content-config digest is a hash of the **text** of the Site's `src/content.config.ts` (`dist/content/utils.js:382`). If it changes, the store is cleared ("Content config changed", `dist/content/content-layer.js:195`). The Site's file is a re-export whose text never changes, however the package's schemas change.
- The `glob` loader skips any entry whose file digest hasn't changed (`dist/content/loaders/glob.js:93`), so the old, already-validated data is reused.
- The build store lives in `cacheDir`, which defaults to `node_modules/.astro` (`dist/content/paths.js:3`); the dev store lives in `.astro/`. Hosts that cache `node_modules` between builds (Netlify does) keep it.
- `astro sync` and `--force` clear the store (`dist/core/sync/index.js:55–76`).

**Impact:** a Theme release that changes a schema could deploy content that was validated against the old schema, with no error, and new defaults or transforms wouldn't run. This is a property of any package-defined collection. Starlight's `docsSchema()` has the same exposure, and no Astro issue was found for it. Nothing in the PRD covered this; it's now R-6.

**The fix (tested on the spike branch):** a second digest, `astro-config-digest`, hashes the resolved Astro config minus `vite`, `integrations` and `adapter` (`content-layer.js:178–191`). A change clears the store. The integration adds the Theme's version to the config in `astro:config:setup`:

```ts
updateConfig({ env: { schema: {
  ASTRO_CHURCH_VERSION: envField.string({ context: "server", access: "public", optional: true, default: pkg.version }),
} } });
```

`pkg` is a JSON import of the package's `package.json`. tsdown keeps it external, so `dist/integration.js` reads the real file at runtime.

**Choosing the config key:** these candidates were tested in a throwaway Astro 7.3.5 project, building with value `1` and then `2`:

| Key | Clears on change | Notes |
|---|---|---|
| `env.schema` (chosen) | ✅ | Documented and validated (`env` is `.strict()`). The integration already sets it (FR-3). Its only effect is one public server variable. The digest includes the `default`, not the runtime value. |
| `image.service.config` | ✅ | Passed to whatever image service is active, including third-party ones. |
| An unknown top-level key | ✅ | Works only because Astro doesn't re-validate `updateConfig` output (initial validation strips unknown keys). A TypeScript error. Fragile. |
| `vite.define` | ❌ | `vite` is excluded from the hash. |
| `markdown.remarkPlugins` | ❌ | Errors: Astro 7 defaults to Sätteri, and remark plugins need `@astrojs/markdown-remark`. |

**Verified in the playground and in a controlled copy:**

| Build | Package state | Result |
|---|---|---|
| Seed | v0.0.1, `subtitle` optional | Passes |
| Control | v0.0.1, `subtitle` required, no version bump | Passes: the stale-cache bug |
| Upgrade | v0.0.2, `subtitle` required | "Astro config changed", then "Clearing content store", then `InvalidContentEntryDataError` |
| Fixed content | `subtitle` added | Clears again, then passes. A failed build doesn't save the new digest, so it can't get stuck half-upgraded. |
| No change | — | Passes with no clearing |

**Limits:**
- It depends on undocumented Astro internals: what `astro-config-digest` hashes and when it clears. A smoke check (build, bump the version, change a schema, expect a failure) would catch a change.
- The version only changes on release, so it protects Sites, not the Theme Author's dev loop. Putting a hash of `dist/content.js` in the same `default` would cover both. Left for the spec.

## Finding 3: extending a Theme schema through `collections` fights the types

**Symptom:** `astroChurchCollections.testCollection.schema.extend(...)` doesn't type-check.

**Cause:** Astro types a collection's `schema` as `S | ((context: SchemaContext) => S)`, and as optional (`dist/content/config.d.ts:58`). The function form is how `image()` is passed in. Neither `undefined` nor a function has `.extend()`. `sojourners.church` doesn't use the function form anywhere, so a runtime narrowing check would work at parity, but it would break the first time the Theme adopted `({ image })`.

**What works (verified):** spread the Theme's collections, replace one with a Site definition, and add a Site-only collection:

```ts
export const collections = {
  ...astroChurchCollections,
  testCollection: siteTestCollection, // a copied schema plus a required `meta` field
  siteOnly: siteOnlyCollection,
};
```

- Without `meta` in `test.yaml`, the build fails with `meta: Required`, so the Site's definition is the one applied.
- The Site-only entry loads.
- The types follow the Site: `testCollection` data has `meta: string`, and `siteOnly` data is `{ title: string }` (`.meta` errors).
- Editing `content.config.ts` cleared the cache on its own ("Content config changed").

**Decided (Tyler, 2026-11-01):** the spec has the package export each collection's schema next to `collections`, so a Site extends a plain Zod object (FR-5's "extend"). Those exports join the public contract (PRD §9). Overriding by copying a schema works, but the Site then stops tracking Theme schema changes.

**Considered and rejected:** switching to Starlight's model, where the package exports loader and schema factories for each collection and the Site wires up every collection. It doesn't fix finding 2. With about 11 collections whose names have to match the Theme's routes (ADR-0003) and the Sveltia config (FR-17), it costs more than it gives. ADR-0004's reasons still hold.

## Finding 4: dev reload (R-4)

| Change during `astro dev` | Editor | Running dev server |
|---|---|---|
| Site content (`test.yaml`) | n/a | ✅ Reloads |
| Package schema (`content.ts`), after tsdown rebuilds | ✅ Hover types update (the TS server reads `dist/content.d.ts`) | ❌ Not applied, even after restarting `astro dev`. Needs `astro sync` or `--force`, which is finding 2's cache. |
| Package integration (`integration.ts`) | n/a | ❌ No restart. Only tsdown reacts. |

**The watch-mode race:** with the original scripts, `pnpm dev` started `tsdown --watch` and `astro dev` together. tsdown's `clean: true` empties `dist/` at the start of the first build. If Astro loads its config in that gap, it fails with `Failed to resolve entry for package "astro-church"`, pnpm's `--parallel` kills tsdown mid-build, and `dist/` is left empty. Fixed on the spike branch:
- The package's `dev` script runs `tsdown --watch --no-clean`. `clean: true` stays in `tsdown.config.ts` for real builds.
- The root `dev` script builds the package once before the parallel run.

**Outside `pnpm dev`,** every package edit needs a manual `pnpm --filter astro-church build` before the editor or the playground sees it.

**For the spec (step 1, package skeleton):** Starlight's `package.json` points `exports` at `./src/*.ts` and swaps to `./dist/*` in `publishConfig.exports`. With that, the playground would read source with no watcher in between, and only the published `.d.ts` would need the finding-1 fix. Try it before deciding how the dev loop works. The other leads are Vite's `server.watch` ignore list and an integration hook that adds watched files.

## Other notes
- **A content validation error blocks type generation.** `astro sync` stops before regenerating `.astro/content.d.ts`, so a Site's editor types go stale while its content is invalid.
- `noRestrictedImports` and unused-variable warnings in the playground's `Layout.astro`/`Card.astro` come from the template, not the spike.

## Carried into the spec
1. `types: ["astro/client"]` in the package `tsconfig`, and a check for `any` in the shipped `.d.ts` files.
2. Cache busting through `env.schema` with the Theme version, and a smoke check that a schema change plus a version bump fails the build. Decide whether to add a hash of the content module for dev.
3. Export each collection's schema next to `collections` (public contract).
4. Custom `srcDir`: a loader wrapper, or state that it isn't supported.
5. The `astro/content/config` path in the shipped types: accept it with a pinned range, or annotate.
6. The dev loop: `exports` → `src` with `publishConfig` → `dist`, `--no-clean` in watch mode, and a build before parallel dev.
