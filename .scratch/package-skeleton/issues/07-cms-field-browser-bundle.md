# 07: The CMS field validator ships as a browser bundle

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** FR-15 (groundwork), NFR-3 · **ADRs:** 0005
**Blocked by:** 02, 06
**Status:** ready-for-human

## Behaviour
A browser-only entry in `client/` imports `scriptureParsing`, and tsdown bundles it, with its dependencies inlined, into a single script under `dist/client/`. The script ships in the tarball. Nothing serves it yet (spec 3.5). It's editor-only, so it's outside NFR-3.

## Acceptance criteria
- [ ] The only tsdown config is the browser one: entries in `client/`, `platform: "browser"`, no explicit target, output to `dist/client/`, dependencies always bundled, no `.d.ts` files.
- [ ] `prepublishOnly` and `pnpm verify` build the bundle.
- [ ] The tarball contains the bundle, and the bundle has no `import` statements.
- [ ] Sveltia's globals, if declared here, live only in `client/` and the no-globals check still passes.

## Public contract
None. The bundle's URL is decided in spec 3.5.

## Seams and test list
Seam: built package (packed-install harness).
- [ ] Tarball contains the bundle
- [ ] Bundle has no `import` statements
- [ ] Bundle exposes the validator (loaded in a scratch HTML page or in Node with a stub; choose in the ticket)
Build and smoke checks: the assertions above, added to the harness.
Manual checks: bundle size is in line with R-3's 265 kB.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

**2026-11-03, from ticket 01:** this ticket brings back the package build that ticket 01 removed: the `build` and `prepublishOnly` scripts, and `tsdown.config.ts`. Open question for Tyler: `prepublishOnly` runs on `publish` but not on `pnpm pack`, which ticket 02's harness uses, so the harness has to build first. `prepack` runs on both. Decide which hook to use before ticking the `prepublishOnly` criterion. Ticket 01 also left `files` as `["src"]`, so add `dist` back (spec, **Package shape**).

## Retro
Learned: · Surprised by: · Next time:
