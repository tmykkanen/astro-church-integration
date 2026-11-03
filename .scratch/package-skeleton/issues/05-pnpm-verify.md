# 05: `pnpm verify` gates every ticket

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** NFR-5, §8a.2 · **ADRs:** 0005
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
One root command checks everything a ticket must keep green: Biome, the package typecheck, the no-ambient-globals rule for shipped source, and `astro check` plus `astro build` for the Starter Site. Tickets 06 and 07 add the Vitest and bundle-build steps.

## Acceptance criteria
- [ ] `pnpm verify` runs Biome, `tsc --noEmit` for the package, the no-globals check, and the Starter Site's `astro check` and `astro build`, stopping at the first failure.
- [ ] `pnpm verify` typechecks the Theme's `.astro` files, for example with `astro check --root packages/astro-church`. Neither `tsc` nor the Starter Site's `astro check` reads them (ticket 01). A deliberate type error in a Theme component fails `verify` (one-time check).
- [ ] The no-globals check fails on a `declare global` or a non-module `.d.ts` under the package's `src/`, and ignores `client/`.
- [ ] CI runs `pnpm verify`.
- [ ] `docs/workflow.md` drops its "until it exists" note.

## Public contract
None.

## Seams and test list
Seam: the check script (or a Vitest test once 06 lands; choose in the ticket).
- [ ] No-globals check passes on the current `src/`
- [ ] No-globals check fails on a fixture with `declare global`
- [ ] No-globals check fails on a fixture non-module `.d.ts`
Build and smoke checks: `pnpm verify` green locally and in CI.
Manual checks: none.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

## Retro
Learned: · Surprised by: · Next time:
