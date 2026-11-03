# 04: A Site re-exports the Theme's content and actions entry points in one line each

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** FR-5, DX-1, DX-3 · **ADRs:** 0004, 0005
**Blocked by:** 02
**Status:** ready-for-human

## Behaviour
`astro-church/content` exports an empty `collections`, and `astro-church/actions` exports an empty `server` plus the type a Site checks its `server` against with `satisfies` (R-2 #2). The Starter Site's content config and actions file are one line each, and their types reach the Site intact.

## Acceptance criteria
- [ ] `exports` has `./content` and `./actions`, pointing into `src`.
- [ ] The Starter Site's content config is a one-line re-export of `collections`.
- [ ] The Starter Site's actions file re-exports `server` and checks it with `satisfies` against the exported type.
- [ ] `astro sync`, `astro check` and `astro build` pass in the workspace and in the packed install.
- [ ] Type probe in the harness: `collections`, `server` and the `satisfies` type aren't `any`. (The check that collection entry `data` isn't `any` moves to spec 3.3, with the first real collection.)

## Public contract
Adds the `astro-church/content` and `astro-church/actions` entry points (PRD §9), both empty for now. The `satisfies` type's name becomes public contract.

## Seams and test list
Seam: built Starter Site (packed-install harness).
- [ ] Type probe: the re-exported `collections` isn't `any`
- [ ] Type probe: the re-exported `server` and the `satisfies` type aren't `any`
- [ ] The probe fails on a deliberate `any` (one-time check that it bites)
Build and smoke checks: `astro check` in the packed install includes the probe.
Manual checks: hover types in the Starter Site's editor.

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
