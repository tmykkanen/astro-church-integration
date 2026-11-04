# 06: The ported scripture tests pass in the package

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** §8a.1, R-5 · **ADRs:** 0005
**Blocked by:** 01, 05
**Status:** resolved

## Behaviour
`scriptureParsing` moves in from `sojourners.church` unchanged, with the part of the shared `lib/types` module it imports and its two parser packages as `dependencies` (R-3 #5). Vitest runs in the package, and the ported `scriptureParsing` test passes unchanged. This is the first ported test and the first real Theme code.

## Acceptance criteria
- [x] `scriptureParsing` and the types it needs are in the package, matching `sojourners.church` apart from changes Tyler approves and logs here.
- [x] `bible-passage-reference-parser` and `bible-reference-formatter` are `dependencies` (types package as a dev dependency if needed).
- [x] Vitest is configured in the package. `tests/lib/scriptureParsing.test.ts` is copied unchanged and passes, apart from its `#/lib/scriptureParsing/` import becoming `#/lib/scriptureParsing/index.ts`. Tyler approved that change, and changes like it, for every ported test (spec, **Internal alias**).
- [x] `#/` imports in the moved source name the file exactly (`types.ts` imports `#/lib/types`, which becomes the exact file).
- [x] `pnpm verify` runs Vitest.
- [x] Risk checked: does `getViteConfig` from `astro/config` (as in `sojourners.church`) work in a package with no Astro config? Record the answer, and any config change, in Comments.
- [x] The relative imports with `.ts` extensions typecheck in the package, and through the Starter Site's `astro check`. (The package half is met. The Site half is deferred to spec 3.4; see Comments, review.)

## Public contract
None.

## Seams and test list
Seam: exported functions (`parseScriptureRef`, `isValidScriptureRef`).
- [x] Ported: `tests/lib/scriptureParsing.test.ts` (change approved: the `#/` import path names the exact file; assertions unchanged)
Build and smoke checks: the packed-install harness still passes (the new modules import).
Manual checks: none.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible
- [x] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
- **2026-11-03, approved change (`utils.ts`):** the package's `strictest` tsconfig turns on `noUncheckedIndexedAccess` (`sojourners.church` uses `strict`), so the unchanged `utils.ts` failed `tsc` with four errors. Tyler's changes, final form after review:
  - **Type guards.** `if (!start || !end) return [];` after splitting the range, `if (!startParts[0]) return [];` before the book lookup, `if (!chapters) return [];` after it, and `?? 0` on `verseCount` and `lastVerse`.
  - **`expandRange(osis)` instead of `expandRange(input)`.** It no longer parses its argument again, and the `if (!osis) return [];` check is gone (the `!start` guard returns `[]` for an empty string). Its only caller, `parseScriptureRef`, already passed `osis`, and `index.ts` doesn't export it.
  - **End chapter and end verse converted once** (`endChapterPart`/`endVersePart` → `Number(...)`), instead of `Number(...)` on every loop test.
  - **`./parser.ts`** with the extension (also in `isValid.ts`).
  
  Behaviour, against `sojourners.church`:
  - The `?? 0`s change nothing. `Array.from({ length: undefined })` already gave `[]`, and `verse < undefined` was already `false`.
  - The `!startParts[0]` guard can't fire for anything `osis()` returns.
  - Dropping the second parse changes nothing for the only caller. The agent re-parsed `osis()` output for 17 references (single verses, chapters, cross-chapter and cross-book ranges, a comma list), and each came back unchanged.
  - The one real change: an unknown book used to throw a `TypeError` out of `parseScriptureRef`, and now gives `expandedRef: []`. As far as we know it isn't reachable, since `osis()` and `translation_info('default').chapters` come from the same parser. It's untested.
- **2026-11-03, approved change (relative imports):** `index.ts`'s four re-exports, `utils.ts` and `isValid.ts` name the file (`./isValid.ts`, `./parser.ts`), so every relative import in `scriptureParsing/` now has its extension, like `parseScriptureRef.ts`. No behaviour change; extensionless relative paths would also resolve under `bundler`.
- **2026-11-03, other differences:** none beyond Biome's double quotes and the `#/lib/types.ts` path the acceptance criteria require. `lib/types.ts` is the whole `sojourners.church` file (only `Ok` and `Err`). `@types/bible-reference-formatter` is in `dependencies`, not dev dependencies (see the review below). Without it, `tsc` fails with TS7016, and a `declare module` shim would break the no-globals rule.
- **2026-11-03, known inherited bugs** (same output in `sojourners.church`; kept for parity, PRD §10). Through `parseScriptureRef`:
  - `Matt 5-7` → `osis` `Matt.5-Matt.7`, `expandedRef` holds chapter 5's 48 verses only. The whole-chapter branch ignores the end chapter.
  - `Gen 50:20-Exod 1:7` → `expandedRef: []`. Ranges that cross books aren't handled.
  - `Gen 1:1, 3` → `expandedRef: ["Gen.1.1,Gen.1.3"]`, unsplit. Comma lists aren't handled.
  
  Carried to spec 3.4 (sermons) in `docs/next-steps.md` for a post-MVP decision.
- **2026-11-03, risk checked (`getViteConfig`):** `getViteConfig` from `astro/config`, with no Astro config, treats the package as a Site rooted at `packages/astro-church`. It finds `src/actions.ts`, turns Actions on and fails while loading the Vitest config with `ActionsWithoutServerOutputError` (from the `astro:routes:resolved` hook). The same defaults would also read `src/pages/` as routes. It's the error ticket 05 hit with `astro check`; ticket 05's `srcDir` trick, passed as `getViteConfig`'s inline Astro config, would likely work here too (not tried).
- **2026-11-03, decided (Vitest config):** a plain `defineConfig` from `vitest/config`, with no Astro plugins and no alias. Why: `scriptureParsing` needs none of Astro's setup, and the alternative means telling Astro to ignore its own entry points. Revisit in spec 3.3 if the ported tests that `vi.mock('astro:content', …)` or `astro:env/*` need Astro's plugins to resolve those modules.
- **2026-11-03, decided (happy-dom):** left out; tests run in Vitest's default Node environment. Add it when the component-test ports need a DOM (`sojourners.church` pins `^20.11.1`).
- **2026-11-03, wired up:** package script `test` (`vitest run`). Root `verify` runs it after `check:globals` and before the Starter Site checks, as the spec's `pnpm verify` order says. `passWithNoTests` kept `verify` green until the ported test landed, then came out (the config is now an empty `defineConfig({})`), so a run that finds no tests fails.
- **2026-11-03, ported test:** Tyler copied `tests/lib/scriptureParsing.test.ts` (the package's first Vitest test, so Tyler's per `workflow.md`). Apart from Biome's quotes, its only difference from `sojourners.church` is the approved import, `#/lib/scriptureParsing/` → `#/lib/scriptureParsing/index.ts`. 14 tests pass. That confirms Vitest resolves `#/` through package.json `imports` with no alias (the spec's ticket-01 risk).
- **2026-11-03, break-it check** (ported tests are an exception to red-first): Tyler broke a line in the moved source, saw the test fail, and restored it.
- **2026-11-03, checks:** `pnpm verify` exits 0. `pnpm test:packed` passes ("all 13 shipped modules load", so the new modules import from the packed package). The Starter Site's `astro check` passes in `verify`, though nothing in the Site imports `scriptureParsing` yet.
- **2026-11-03, follow-up:** moving `no-globals.tests.mjs` from `node:test` to Vitest is ticket 09. Ticket 05's reason for `node:test` (no dependency before 06) is gone.
- **2026-11-03, review:** findings and outcomes:
  - **Fixed:** the `verify` order. Vitest had run between `test:no-globals` and `check:globals`, splitting the spec's step 3.
  - **Fixed:** `@types/bible-reference-formatter` moved to `dependencies`. ADR-0005 has a Site's `astro check` typecheck the Theme's `.ts` source under the Site's tsconfig (`strict`, so `noImplicitAny`). A packed install doesn't get dev dependencies, so a Site could hit TS7016 once it imports `scriptureParsing`. It's plausible, not proven; cheap insurance.
  - **Fixed:** inconsistent relative imports (see the approved change above).
  - **Fixed:** inherited smells in `utils.ts`, the double parse and the repeated `Number(...)` (see the approved change above). The other inherited smells are kept for parity: OSIS references are plain `string`s, and `index.ts` exports the shared, mutable `parser`.
  - **Deferred:** the Site half of AC 7. Nothing the Site can import reaches `scriptureParsing` (`exports` has only `.`, `./content` and `./actions`), so the Site's `astro check` never sees it. It gets proven when the first exported module imports it (spec 3.4), with a check that the Site's `astro check` reports no TS7016.
  - **Logged:** `tsc` doesn't typecheck `tests/`, because the package tsconfig includes only `src`. A ported test's `#/` path is checked only by Vitest's runtime resolution. Ticket 09 may add a tests tsconfig.
  - **Decided, no changeset:** nothing a Site can import or see changes. The package does gain three runtime dependencies (the two parsers and `@types/bible-reference-formatter`; the parser is about 30 MB installed, as in `sojourners.church`). The changeset that ships `scriptureParsing` to a Site (spec 3.4) covers it.
  - **Kept:** `defineConfig({})` is empty, but it's where ticket 09's `include` goes.
- **2026-11-03, final checks:** `pnpm verify` exits 0 (14 tests), and `pnpm test:packed` passes ("all 13 shipped modules load").

## Retro
Learned: · Surprised by: · Next time:
