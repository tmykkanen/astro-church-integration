# 08: The dev loop works, its limits are documented, and the spec closes

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** DX-4, DX-5, R-4 · **ADRs:** 0005
**Blocked by:** 03, 04, 07
**Status:** ready-for-human

## Behaviour
The root `pnpm dev` builds the bundle once, then runs the bundle watcher and the Starter Site's `astro dev` in parallel. The package README's contributing section has a reload table that says what reaches a running dev server for each kind of edit, so restarts are expected rather than surprising. Then the spec closes.

## Acceptance criteria
- [ ] `pnpm dev` starts cleanly from an empty `dist/`, without the R-1 race.
- [ ] The reload table covers: Theme component, CSS, integration, collections, actions, saving the Site's actions file after a Theme action edit (R-2 leftover), and the rebuilt bundle (R-3 leftover).
- [ ] The table is in the package README's contributing section.
- [ ] Spec close-out: spec retro written, `docs/next-steps.md` updated (3.1 done), and the PRD's R-4 note updated if the results changed it.

## Public contract
None.

## Seams and test list
Seam: manual (dev server).
- [ ] Fill in the reload table, one edit at a time, in a running `pnpm dev`
Build and smoke checks: `pnpm verify` and the harness green.
Manual checks: the table itself.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green (before ticket 05: `pnpm lint` and the package build); the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

## Retro
Learned: · Surprised by: · Next time:
