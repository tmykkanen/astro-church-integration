# 09: The no-globals check's tests run on Vitest

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** None · **ADRs:** None
**Blocked by:** 06
**Status:** ready-for-human

## Behaviour
The package has one unit-test runner. The no-globals check's tests move from `node:test` to Vitest, so `pnpm --filter astro-church test` runs them alongside the ported tests, and `verify` loses its separate `test:no-globals` step. The check itself (`no-globals.mjs`, run by `check:globals`) stays a plain Node script. Ticket 05 chose `node:test` only because Vitest wasn't installed before ticket 06.

## Acceptance criteria
- [ ] The no-globals tests run under Vitest with the same cases and assertions, apart from changes Tyler approves and logs here. These are ticket 05's own tests, not ported ones, but rewriting existing tests still needs Tyler's approval of each change first.
- [ ] Optional (from ticket 06's review): a tsconfig for `tests/`, so `tsc` checks the ported tests' `#/` paths too. Tyler decides whether it belongs here.
- [ ] The file is renamed so Vitest's default pattern collects it (`.tests.mjs` was chosen so it wouldn't), or the Vitest config's `include` names it. Tyler decides which.
- [ ] Vitest doesn't collect anything under `tests/checks/fixtures/`, `tests/packed/` or `tests/astro-check/`.
- [ ] The root `test:no-globals` script is gone, and `verify` and anything else that called it (CI, Lefthook) no longer do.
- [ ] The spec's `pnpm verify` section matches the new order.

## Public contract
None.

## Seams and test list
Seam: the no-globals check script, run over fixtures (unchanged from ticket 05).
- [ ] Every ticket 05 no-globals test passes under Vitest, from `tests/checks/` (changes approved: …)
Build and smoke checks: `pnpm verify` green; Vitest's output lists both test files.
Manual checks: the break-it check from ticket 05 still fails a test (for example, the `declare global` fixture passes when it shouldn't).

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

## Retro
Learned: · Surprised by: · Next time:
