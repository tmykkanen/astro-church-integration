# 07: The CMS field validator ships as a browser bundle

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** FR-15 (groundwork), NFR-3 · **ADRs:** 0005
**Blocked by:** 02, 06
**Status:** resolved

## Behaviour
A browser-only entry in `client/` imports `scriptureParsing`, and tsdown bundles it, with its dependencies inlined, into a single script under `dist/client/`. The script ships in the tarball. Nothing serves it yet (spec 3.5). It's editor-only, so it's outside NFR-3.

## Acceptance criteria
- [x] The only tsdown config is the browser one: entries in `client/`, `platform: "browser"`, no explicit target, output to `dist/client/`, dependencies always bundled, no `.d.ts` files.
- [x] `prepack` (which runs on both `pnpm pack` and `pnpm publish`) and `pnpm verify` build the bundle, and `files` includes `dist`.
- [x] The tarball contains the bundle, and the bundle has no `import` statements.
- [x] Sveltia's globals, if declared here, live only in `client/` and the no-globals check still passes.

## Public contract
None. The bundle's URL is decided in spec 3.5.

## Seams and test list
Seam: built package (packed-install harness).
- [x] Tarball contains the bundle (tightened: the tarball's `dist/` is exactly the bundle)
- [x] Bundle has no `import` statements
- [x] Bundle registers the validator: in Node, with stubs for Sveltia's globals (`CMS`, `createClass`, `h`), importing the bundle calls `CMS.registerFieldType("scripture", …)` once, and the control's `isValid` returns `true` for a valid reference and an error for an invalid one
Build and smoke checks: the assertions above, added to the harness.
Manual checks: bundle size is in line with R-3's 265 kB.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible (not user-visible: nothing serves the bundle until spec 3.5)
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

**2026-11-03, from ticket 01:** this ticket brings back the package build that ticket 01 removed: the `build` and `prepublishOnly` scripts, and `tsdown.config.ts`. Open question for Tyler: `prepublishOnly` runs on `publish` but not on `pnpm pack`, which ticket 02's harness uses, so the harness has to build first. `prepack` runs on both. Decide which hook to use before ticking the `prepublishOnly` criterion. Ticket 01 also left `files` as `["src"]`, so add `dist` back (spec, **Package shape**).

**2026-11-05, decisions (plan):**
- **Build hook: `prepack`, not `prepublishOnly`.** `prepack` runs on `pnpm pack` and on `pnpm publish`, so ticket 02's harness always packs a freshly built bundle and can't test a stale or missing one. The acceptance criterion now names `prepack`.
- **"Exposes the validator" is checked in Node with stubs, not in a browser.** The test sets stub `CMS`, `createClass` and `h` globals, imports the bundle from the packed install, and checks the registration and `isValid`. It runs in the packed-install harness (`pnpm test:packed`, in CI) with no browser. It covers the validator, not rendering in Sveltia; that stays a manual check in spec 3.5.

**2026-11-05, tests and traces (test, plan):**
- **AC 1:** manual review of `tsdown.config.ts`. `entry` is `["client/**/*.ts", "!client/**/*.d.ts"]`; without the exclusion, `sveltia.d.ts` became an empty `dist/client/sveltia.d.js` entry. The harness's exact-`dist/` check now catches that.
- **AC 2:** `prepack` builds before every `pnpm pack`, which the harness relies on (`npm_config_ignore_scripts` didn't skip it). Root `verify` now runs `pnpm --filter astro-church build` after Vitest, matching the spec's order.
- **AC 3:** harness checks "the tarball's dist/ is exactly the CMS field bundle" and "the CMS field bundle has no imports". The second uses `es-module-lexer`, loaded through the packed Site's `astro`: a text search fails on the bundled parser's error message, which contains `import * as lang from "esm/lang/en.js";` inside a template string. Seen red against a build without `alwaysBundle` (two parser imports, and the bundle drops from 265 kB to 1 kB).
- **AC 4:** `client/sveltia.d.ts` plus `client/tsconfig.json` (`types: []`, `include: ["."]`), checked by `tsc -p client` in `typecheck`. `check:globals` passes; a `CMS` reference in `src/` fails `tsc --noEmit` (Tyler's leak check).
- **Register test:** `tests/packed/register-validator.mjs`, run by the harness in its own process. Seen red against three fake bundles: no registration, the wrong field name, and an `isValid` that always returns `true`.
- **Manual:** bundle is 265.44 kB (39.07 kB gzip), in line with R-3.
- `pnpm verify` green (2026-11-05), after Tyler fixed Biome's formatting of `client/tsconfig.json`.

**2026-11-05, review (against `main`):** no hard standards violations; every acceptance criterion met; no change to the public contract (`exports` doesn't expose `dist/`).
- **Fixed by the agent:** `docs/workflow.md`'s `verify` list (adds `tsc -p client` and the bundle build), the spec's "All three run as the package's `typecheck` script", the harness header's order of checks, and this note.
- **Done by Tyler (production):** in `tsdown.config.ts`, unwrap the one-config array; drop `unbundle: false` (tsdown's default); comment why `onlyBundle: false` stays (it turns off tsdown's hint about bundled dependencies); and replace the two parser subpaths in `alwaysBundle` with `[/.*/]`, so every dependency is bundled as AC 1 says, including `bible-reference-formatter` for a later entry that reaches `parseScriptureRef.ts`. A scratch build with that config gave the same code. Tyler also pointed tsdown's `tsconfig` option at `client/tsconfig.json`. `pnpm verify` and `pnpm test:packed` green afterwards; the bundle is still 265.44 kB.
- **Left as is:** the reorder of `@types/bible-reference-formatter` in `dependencies` (from `pnpm add`); the Astro-copy loading shape shared by `harness.mjs` and `import-modules.mjs` (extract a helper if a third use appears).
- **Inherited bug, carried to spec 3.5 (parity, PRD §10):** the field's `isValid` throws on `undefined` or `null` (`Cannot read properties of undefined (reading 'replace')`); `""` returns the error correctly. `sojourners.church`'s field does the same. `sveltia.d.ts` types `isValid`'s value as `string`, while `FieldProps.value` is `unknown`, which hides it. Spec 3.5 should check what Sveltia passes for an empty field.

## Retro
Learned: · Surprised by: · Next time:
