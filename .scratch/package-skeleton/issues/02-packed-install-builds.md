# 02: A packed install of the Theme builds

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** §8a.3, §8a.4 · **ADRs:** 0005
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
A script packs the package, installs the tarball into a temporary copy of the Starter Site outside the workspace, and runs `astro check`, `astro build` and smoke checks. CI runs it on every PR. This proves that a Site installing from npm, not through the workspace symlink, gets a working Theme.

## Acceptance criteria
- [ ] One command runs the whole harness locally and exits non-zero on any failure.
- [ ] The Starter Site copy is outside the workspace and uses the tarball, not `workspace:*`.
- [ ] Smoke checks: the skeleton route's page exists, every shipped module imports (R-3 #9), and the tarball contains no test files.
- [ ] A CI job runs the harness on every PR.
- [ ] Risk checked: Astro compiles the package's `.ts` source from `node_modules` (`noExternal`).
- [ ] Risk checked: does a Site's `astro check` typecheck the Theme's source with the Site's TypeScript? TypeScript 5.x rejects the `#/` imports (TS2307), and 6.0 accepts them (ticket 01). If 5.x fails, decide whether "TypeScript ≥ 6" goes in NFR-1 or the README. Record the result in Comments.

## Public contract
None.

## Seams and test list
Seam: built Starter Site (from the packed tarball). Later specs add their own checks to this harness.
- [ ] Route page exists in the build output
- [ ] Every module in the tarball's `src/` imports
- [ ] No test files in the tarball
- [ ] Deliberately break an import, confirm the harness fails, then revert (one-time check)
Build and smoke checks: the harness itself, locally and in CI.
Manual checks: the CI run on the ticket's PR or branch.

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
