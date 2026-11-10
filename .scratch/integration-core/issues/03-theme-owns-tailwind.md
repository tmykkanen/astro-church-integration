# 03: The Theme owns Tailwind

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-3, FR-6, NFR-3 · **ADRs:** 0002, 0005
**Blocked by:** 01
**Status:** resolved

## Behaviour
A Site no longer adds the Tailwind Vite plugin: the integration adds it unless the Site already has it. Only the Theme's stylesheet imports Tailwind, so each page loads Tailwind's base styles once. The Starter Site drops what it kept from before the Theme had pages (its plugin, stylesheet, layout, pages and test component) and keeps its sample content, which still proves Tailwind scans the Site.

## Acceptance criteria
- [x] The integration adds `@tailwindcss/vite` unless a plugin named `@tailwindcss/vite…` is already in the Site's `vite.plugins`.
- [x] `@tailwindcss/vite` and `tailwindcss` are in the package's `dependencies`.
- [x] The Starter Site has no Tailwind plugin, no stylesheet, layout, pages or components of its own, and no `tailwindcss` dependency. It still builds.
- [x] Tailwind's preflight appears exactly once in the packed install's skeleton route CSS.
- [x] 3.1's checks still pass: the Theme-only and content-only classes reach the skeleton route's CSS.
- [x] The README says Site stylesheets never import Tailwind. The `@reference` instructions are deferred to 3.6 (see Comments).

## Public contract
None. A Site that keeps its own Tailwind plugin still works.

## Seams and test list
Seam: the `astro:config:setup` hook (from 01), plus the packed-install harness.
- [x] The hook adds the Tailwind plugin when the Site has none
- [x] The hook adds no Tailwind plugin when the Site already has one
- [x] Harness: preflight appears once in the skeleton route's CSS

Build and smoke checks: the harness check above, and 3.1's class checks.
Manual checks: the skeleton route is styled in `astro dev`.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible
- [x] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
- **Criteria to checks (2026-11-09).** 1: `tests/integration/tailwind.test.ts` (added when the Site has none; not added when the Site's plugins include it, directly or after falsy entries). 2: the packed install builds with no Tailwind in the Site. 3: `pnpm verify` builds the stripped Starter Site. 4: the harness's preflight-once check. 5: the harness's class checks. 6: README "Styling" section, read by hand. Manual check: `/theme-skeleton` styled in `astro dev` (Tyler).
- **Red first.** The "Site already has one" test failed against the first implementation, which always added the plugin, before the name check made it pass. The preflight-once check was written after the Starter Site cleanup, so it never failed against a real build. Its matcher was checked on the built CSS instead: it counts 1 once, 2 doubled, 0 with the reset removed.
- **Public contract.** Unchanged, but additive: Sites may drop their own Tailwind plugin and the `tailwindcss` and `@tailwindcss/vite` dependencies (changeset `theme-owns-tailwind`).
- **`@reference` deferred to 3.6.** A Site no longer depends on `tailwindcss`, so `@reference "tailwindcss"` from a Site stylesheet likely won't resolve under pnpm, and the Theme's stylesheet isn't exported. The README states the never-import rule and defers the `@reference` instructions; the question is logged under 3.6 in `docs/next-steps.md`.
- **Known limit.** A Promise in `vite.plugins` isn't inspected, so a Site that adds Tailwind that way gets a second copy. Plugins added by integrations listed after the Theme aren't visible either; the spec accepts this.
- **Review (2026-11-09).** Fixed: dependency order, README `@reference` wording, harness comment, test tidy-up (`vi.mocked`, shared name matcher, falsy-entry case). Open for ticket 04: extract the "Site already has a plugin named…" check into a helper before `astro-icon` and sitemap repeat it, and consider one named function per concern in `astro:config:setup`.
