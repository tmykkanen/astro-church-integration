# 04: A Site re-exports the Theme's content and actions entry points

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** FR-5, DX-1, DX-3 · **ADRs:** 0004, 0005
**Blocked by:** 02
**Status:** resolved

## Behaviour
`astro-church/content` exports an empty `collections`, and `astro-church/actions` exports an empty `server` plus the type a Site checks its `server` against with `satisfies` (R-2 #2). The Starter Site's content config is one line, its actions file one import and one export, and their types reach the Site intact.

## Acceptance criteria
- [x] `exports` has `./content` and `./actions`, pointing into `src`.
- [x] The Starter Site's content config is a one-line re-export of `collections`.
- [x] The Starter Site's actions file re-exports `server` and checks it with `satisfies` against the exported type.
- [x] `astro sync`, `astro check` and `astro build` pass in the workspace and in the packed install.
- [x] Type probe in the harness: `collections`, `server` and the `satisfies` type aren't `any`. (The check that collection entry `data` isn't `any` moves to spec 3.3, with the first real collection.)

## Public contract
Adds the `astro-church/content` and `astro-church/actions` entry points (PRD §9), both empty for now. The `satisfies` type's name becomes public contract.

## Seams and test list
Seam: built Starter Site (packed-install harness).
- [x] Type probe: the re-exported `collections` isn't `any`
- [x] Type probe: the re-exported `server` and the `satisfies` type aren't `any`
- [x] The probe fails on a deliberate `any` (one-time check that it bites)
- [x] Type probe: a `server` with an extra Site action satisfies `ThemeActions` (plus a key probe, `string extends keyof ThemeActions`, because the `satisfies` probe can't fail while `server` is empty)
- Deferred to spec 3.4: a `server` missing a Theme action fails `satisfies ThemeActions` (needs a real Theme action; with `server` empty there's nothing to remove)
Build and smoke checks: `astro check` in the packed install includes the probe.
Manual checks: hover types in the Starter Site's editor.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible
- [x] PRD, ADR, GLOSSARY or README updated if anything changed (PRD §9 names `ThemeActions`)

## Learning goal (optional)

## Comments

- **Adapter (2026-11-03):** Astro fails `astro sync` with `ActionsWithoutServerOutputError` once a Site has an actions file, even with an empty `server`. PRD §9 already says every Site needs an adapter, but spec 3.1 and this ticket didn't plan for one. The Starter Site now uses `@astrojs/node` (`standalone`), as in the R-2 spike, until spec 3.7 replaces it with Netlify; the version isn't pinned for that reason. With an adapter, prerendered pages go to `dist/client/`, so both smoke checks (`tests/build/skeleton-route.mjs`, `tests/packed/harness.mjs`) now read from there (approved by Tyler). The adapter also turns on sessions with filesystem storage; revisit in 3.7.
- **`ThemeActions` is open (2026-11-03):** `typeof server` plus a string index signature, so a Site can add actions. A plain `typeof server` would reject them under `satisfies` (TS2353), which the R-2 spike never tested. The Starter Site uses the spread form, `{ ...astroChurchServer } satisfies ThemeActions`, so a Site adds actions inside the braces. Its actions file is an import plus one export rather than one line.
- **Evidence (2026-11-03):** workspace `astro sync`, `astro check` (0 errors) and `astro build` pass; the packed harness passes, with `astro check` reading `fixtures/type-probe.ts`; each probe was seen to fail once (a deliberate `any`; a closed `ThemeActions`); `pnpm lint` clean. Tyler checked the hover types in the Starter Site's editor.
- **Review (2026-11-03):** fixed: DX-1, spec line 80, `AGENTS.md` and this ticket's Behaviour now describe the actions file as an import plus one `satisfies` export; PRD §9's `ThemeActions` line says Sites may not remove Theme actions or change their result shapes (what the type checks; a same-shape replacement is allowed); the changeset says the adapter isn't new; the probe header covers both kinds of probe; `src/actions.ts` says why the type is open. Carried in `docs/next-steps.md`: 3.3 (real `collections` type), 3.4 (missing-action probe, `{}` `server` type, closing `ThemeActions` is breaking), 3.7 (replace the adapter; sessions). Accepted: `@astrojs/node` unpinned; the `dist/client/` path repeated in two scripts; the probe runs only in the packed harness, not the workspace `astro check` (ticket 05 could add it); the `.changeset/config.json` repo fix rides along. Not done: a `GLOSSARY.md` entry for `ThemeActions`.

## Retro
Learned: · Surprised by: · Next time:
