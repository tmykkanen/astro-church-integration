# 06: The ported scripture tests pass in the package

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** §8a.1, R-5 · **ADRs:** 0005
**Blocked by:** 01, 05
**Status:** ready-for-human

## Behaviour
`scriptureParsing` moves in from `sojourners.church` unchanged, with the part of the shared `lib/types` module it imports and its two parser packages as `dependencies` (R-3 #5). Vitest runs in the package, and the ported `scriptureParsing` test passes unchanged. This is the first ported test and the first real Theme code.

## Acceptance criteria
- [ ] `scriptureParsing` and the types it needs are in the package, matching `sojourners.church` apart from changes Tyler approves and logs here.
- [ ] `bible-passage-reference-parser` and `bible-reference-formatter` are `dependencies` (types package as a dev dependency if needed).
- [ ] Vitest is configured in the package. `tests/lib/scriptureParsing.test.ts` is copied unchanged and passes, apart from its `#/lib/scriptureParsing/` import becoming `#/lib/scriptureParsing/index.ts`. Tyler approved that change, and changes like it, for every ported test (spec, **Internal alias**).
- [ ] `#/` imports in the moved source name the file exactly (`types.ts` imports `#/lib/types`, which becomes the exact file).
- [ ] `pnpm verify` runs Vitest.
- [ ] Risk checked: does `getViteConfig` from `astro/config` (as in `sojourners.church`) work in a package with no Astro config? Record the answer, and any config change, in Comments.
- [ ] The relative imports with `.ts` extensions typecheck in the package, and through the Starter Site's `astro check`.

## Public contract
None.

## Seams and test list
Seam: exported functions (`parseScriptureRef`, `isValidScriptureRef`).
- [ ] Ported: `tests/lib/scriptureParsing.test.ts` (change approved: the `#/` import path names the exact file; assertions unchanged)
Build and smoke checks: the packed-install harness still passes (the new modules import).
Manual checks: none.

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
