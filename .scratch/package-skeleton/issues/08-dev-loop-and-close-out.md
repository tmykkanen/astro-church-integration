# 08: The dev loop works, its limits are documented, and the spec closes

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** DX-4, DX-5, R-4 · **ADRs:** 0005
**Blocked by:** 03, 04, 07
**Status:** resolved

## Behaviour
The root `pnpm dev` builds the bundle once, then runs the bundle watcher and the Starter Site's `astro dev` in parallel. The package README's contributing section has a reload table that says what reaches a running dev server for each kind of edit, so restarts are expected rather than surprising. Then the spec closes.

## Acceptance criteria
- [x] `pnpm dev` starts cleanly from an empty `dist/`, without the R-1 race. (Manual check, 2026-11-05.)
- [x] The reload table covers: Theme component, CSS, integration, collections, actions, saving the Site's actions file after a Theme action edit (R-2 leftover), and the rebuilt bundle (R-3 leftover). (Manual checks, 2026-11-05.)
- [x] The table is in the package README's contributing section.
- [x] The walking skeleton's injected route (`/theme-skeleton`, from ticket 01) has a named owner for its removal before the first release: a ticket in spec 3.4 or 3.7, recorded in `docs/next-steps.md`. Injected URLs are public contract (PRD §9), so it mustn't ship.
- [x] Spec close-out: spec retro written, `docs/next-steps.md` updated (3.1 done), and the PRD's R-4 note updated if the results changed it. (Spec retro skipped by Tyler's choice, 2026-11-05.)

## Public contract
None.

## Seams and test list
Seam: manual (dev server).
- [x] Fill in the reload table, one edit at a time, in a running `pnpm dev`
Build and smoke checks: `pnpm verify` and the harness green.
Manual checks: the table itself.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible (none: contributor tooling and the README's Contributing section only)
- [x] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
- 2026-11-05: `pnpm verify` green (reported by Tyler). `pnpm test:packed` (the harness) not run.
- 2026-11-05: found during the collections reload check: `getCollection` returns `any` inside the Theme's own `.astro` files, because the package has no generated `.astro/content.d.ts`. Carried to spec 3.3 in `docs/next-steps.md`.
- 2026-11-05: the PRD R-4 note now points at the README's reload table instead of listing limits. One limit changed: action edits take effect when the Site's `src/actions/index.ts` is saved, with no restart.
- 2026-11-05: review findings resolved in the docs (glossary terms, PRD R-4 note, bundle row wording, next-steps sub-lists). Kept as separate rows by choice: actions, and saving the Site's actions file. Not checked, by Tyler's choice: review question 1 (does Ctrl-C stop the backgrounded `astro dev`) and `pnpm test:packed`.

## Retro
Learned: · Surprised by: · Next time:
