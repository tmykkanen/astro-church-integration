# 09: The no-globals check's tests run on Vitest

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** None · **ADRs:** None
**Blocked by:** 06
**Status:** resolved

## Behaviour
The package has one unit-test runner. The no-globals check's tests move from `node:test` to Vitest, so `pnpm --filter astro-church test` runs them alongside the ported tests, and `verify` loses its separate `test:no-globals` step. The check itself (`no-globals.mjs`, run by `check:globals`) stays a plain Node script. Ticket 05 chose `node:test` only because Vitest wasn't installed before ticket 06.

## Acceptance criteria
- [x] The no-globals tests run under Vitest with the same cases and assertions, apart from changes Tyler approves and logs here. These are ticket 05's own tests, not ported ones, but rewriting existing tests still needs Tyler's approval of each change first.
- [x] Optional (from ticket 06's review): a tsconfig for `tests/`, so `tsc` checks the ported tests' `#/` paths too. Tyler decides whether it belongs here. **Deferred** (Tyler, 2026-11-03).
- [x] The file is renamed so Vitest's default pattern collects it (`.tests.mjs` was chosen so it wouldn't), or the Vitest config's `include` names it. Tyler decides which.
- [x] Vitest doesn't collect anything under `tests/checks/fixtures/`, `tests/packed/` or `tests/astro-check/`.
- [x] The root `test:no-globals` script is gone, and `verify` and anything else that called it (CI, Lefthook) no longer do.
- [x] The spec's `pnpm verify` section matches the new order.

## Public contract
None.

## Seams and test list
Seam: the no-globals check script, run over fixtures (unchanged from ticket 05).
- [x] Every ticket 05 no-globals test passes under Vitest, from `tests/checks/` (changes approved: 1–5, see Comments)
Build and smoke checks: `pnpm verify` green; Vitest's output lists both test files.
Manual checks: the break-it check from ticket 05 still fails a test (for example, the `declare global` fixture passes when it shouldn't).

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible (not user-visible: none needed)
- [x] PRD, ADR, GLOSSARY or README updated if anything changed (none needed; the spec, `docs/workflow.md` and `docs/next-steps.md` updated)

## Learning goal (optional)

## Comments
- **2026-11-03, decisions (Tyler):** **rename** (`no-globals.tests.mjs` → `no-globals.test.mjs`, so Vitest's default `include` collects it and `vitest.config.ts` stays empty); **tsconfig for `tests/` deferred** (out of scope here).
- **2026-11-03, test changes approved by Tyler:** (1) `node:test` and `node:assert/strict` imports → `import { expect, test } from "vitest"`; (2) `assert.equal(status, 0, stderr)` → `expect(status, stderr).toBe(0)`; (3) `assert.equal(status, 1)` → `expect(status).toBe(1)`; (4) `assert.match(stderr, re)` → `expect(stderr).toMatch(re)`; (5) the header's "Run:" line now names `pnpm --filter astro-church test`, and the `.tests.mjs` naming note was removed. Same 5 cases, names, regexes and fixtures. Biome's import grouping also added a blank line before the `vitest` import.
- **2026-11-03, collected:** `vitest list --filesOnly` shows only `tests/checks/no-globals.test.mjs` and `tests/lib/scriptureParsing.test.ts`; nothing from `fixtures/`, `packed/` or `astro-check/`. `pnpm --filter astro-church test`: 2 files, 19 tests pass.
- **2026-11-03, wired up (agent, `plan:`):** root `test:no-globals` removed and dropped from `verify`; CI and Lefthook call only `pnpm verify`, so they needed no change. The spec's `pnpm verify` steps 3–4 updated. `pnpm verify` green.
- **2026-11-03, break-it check (Tyler):** with the `declare global` block deleted from `fixtures/declare-global/env.ts`, the `declare global` test failed under Vitest and `pnpm verify` stopped at the Vitest step. Reverted; 19 pass. Commenting the block out instead did *not* break it: the check's regex reads comments, so `// declare global` still counts. That's the reverse of ticket 05's accepted limit (an `export` in a comment hides a non-module `.d.ts`): a false positive, so the check fails safe. Accepted for our own source; no test pins it.
- **2026-11-03, review:** no hard findings on either axis; no public-contract, security or footprint change. Resolved: `docs/workflow.md` §8 now says Vitest runs the check's tests; this log's item (5) wording; bold labels on these comments; the test list's approvals filled in; the test header's "(Vitest; moved from node:test in ticket 09)" dropped (approved by Tyler). Left as is: the three failure tests repeat one shape (predates this ticket; same cases kept), and top-level `test` instead of the sibling's `describe`/`it` (approved in change 1).

## Retro
Learned: · Surprised by: · Next time:
