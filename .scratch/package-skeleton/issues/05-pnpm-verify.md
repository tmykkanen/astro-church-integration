# 05: `pnpm verify` gates every ticket

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** NFR-5, §8a.2 · **ADRs:** 0005
**Blocked by:** 01
**Status:** resolved

## Behaviour
One root command checks everything a ticket must keep green: Biome, the package typecheck, the no-ambient-globals rule for shipped source, and `astro check` plus `astro build` for the Starter Site. Tickets 06 and 07 add the Vitest and bundle-build steps.

## Acceptance criteria
- [x] `pnpm verify` runs Biome, `tsc --noEmit` for the package, the no-globals check, and the Starter Site's `astro check` and `astro build`, stopping at the first failure.
- [x] `pnpm verify` typechecks the Theme's `.astro` files, for example with `astro check --root packages/astro-church`. Neither `tsc` nor the Starter Site's `astro check` reads them (ticket 01). A deliberate type error in a Theme component fails `verify` (one-time check).
- [x] The no-globals check fails on a `declare global` or a non-module `.d.ts` under the package's `src/`, and ignores `client/`.
- [x] CI runs `pnpm verify`.
- [x] `docs/workflow.md` drops its "until it exists" note.

## Public contract
None.

## Seams and test list
Seam: the check script, `tests/checks/no-globals.mjs <dir>` (exit 0 clean, 1 with reasons on stderr), tested with `node --test` in `tests/checks/no-globals.tests.mjs` (chosen 2026-11-03).
- [x] No-globals check passes on the current `src/`
- [x] No-globals check fails on a fixture with `declare global`
- [x] No-globals check fails on a fixture non-module `.d.ts`
- [x] No-globals check ignores a `client/` folder next to `src/` (added; see Comments)
Build and smoke checks: `pnpm verify` green locally and in CI.
Manual checks: none.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible (not user-visible: dev tooling only, nothing in `files`)
- [x] PRD, ADR, GLOSSARY or README updated if anything changed (spec 3.1 and `docs/workflow.md` updated; no PRD, ADR or GLOSSARY change)

## Learning goal (optional)

## Comments
- **2026-11-03, seam:** a standalone Node script plus `node:test`, not Vitest; it needs no dependency before 06. The test file is named `.tests.mjs` so Vitest's default glob doesn't collect it in 06. The check is a regex, not a parser: an `export` in a comment makes a `.d.ts` count as a module. That's accepted for our own source.
- **2026-11-03, "ignores `client/`":** met by `verify` passing only `packages/astro-church/src` (root script `check:globals`), not by logic in the check. Test 4 pins that boundary; pointed at the fixture's parent folder, the check does flag `client/`. Tyler chose this over a check that takes the package root and skips `client/`.
- **2026-11-03, wired up:** root scripts `verify`, `check:globals`, `test:no-globals` (renamed from `test:checks` at review); Lefthook pre-push and CI's `test` job now run `pnpm verify`. `verify` calls `pnpm --filter astro-church typecheck`, Tyler's script. The Starter Site build runs inside `tests/build/skeleton-route.mjs`, so `verify` doesn't build twice.
- **2026-11-03, finding:** `astro check --root packages/astro-church` (run with the Starter Site's `@astrojs/check`) fails before typechecking: Astro reads `src/actions.ts` as the project's actions file and throws `ActionsWithoutServerOutputError`, since the package has no config and no adapter. The Theme `.astro` typecheck needs a different root or config; Tyler to decide.
- **2026-11-03, Theme `.astro` typecheck:** the package's `typecheck` script runs `tsc --noEmit && astro check --root tests/astro-check`. `tests/astro-check/` is a check-only root: `srcDir` points at a missing folder (so no actions file is found) and its tsconfig includes `../../src`. Astro writes `.astro/` there, now ignored at the root.
- **2026-11-03, one-time check:** with `const num: number = "0"` in `Skeleton.astro`, `pnpm verify` exited 1 at the Theme `astro check` (`ts(2322)`, plus `ts(6133)` for the unused variable); `tsc` had passed. Without it, `verify` is green.
- **2026-11-03, break-it checks** (`workflow.md`, exceptions to red-first): test 1 ("passes on the current `src/`") is a characterisation test; the same check fails on each failing fixture (the `declare global`, `.d.ts` and `.d.mts` tests), and run over `fixtures/` it reports all four. Test 4 (`client/`) passed on first run; pointed at `with-client/` instead of `with-client/src/`, the check flags `client/sveltia.d.ts`.
- **2026-11-03, review:** findings and outcomes:
  - Fixed: non-module `.d.mts`/`.d.cts` weren't caught (`endsWith(".d.ts")`); new test "fails on a fixture non-module `.d.mts`" went red, then `DECLARATION_FILE = /\.d\.(ts|mts|cts)$/`.
  - Fixed: `spec.md` step 2 records the `tests/astro-check` root and why; its stale "Until `pnpm verify`" line is gone.
  - Fixed: regexes renamed `SOURCE_FILE` and `MODULE_SYNTAX`, the comment on the regex's limits corrected, failures printed with `FAIL:` like the sibling scripts; root `test:checks` renamed `test:no-globals`; the `ci.yml` comment points to the spec instead of repeating the steps.
  - Kept: test 1 overlaps `check:globals` (cheap); test 4 doesn't pin the `check:globals` path (Tyler's decision above).
  - Fixed (Tyler): package `package.json` key order; `scripts` sits after `files`, before `keywords`, as committed in `e5ff899`.
  - Closed: CI run on push (see below).
  - Accepted deviation (Tyler, 2026-11-03): the agent drafted the package's first unit test (`no-globals.tests.mjs`, run with `node:test`), which `workflow.md` ("first test of each new kind") reserves for Tyler. Tyler reviewed and approved each test as it was drafted and kept them as written. The rule still applies to the first Vitest test (ticket 06).
- **2026-11-03, CI on push:** CI run 41742687138 on `main` at `212a3a0` (the ticket 05 merge) passed: `test` (`pnpm verify`) and `packed` (`pnpm test:packed`). The same push's Release run failed because repo settings didn't allow Actions to create PRs. That's unrelated to this ticket; after the setting was enabled, the rerun opened release PR #2.

## Retro
Learned: · Surprised by: · Next time:
