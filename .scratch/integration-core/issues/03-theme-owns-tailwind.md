# 03: The Theme owns Tailwind

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-3, FR-6, NFR-3 · **ADRs:** 0002, 0005
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
A Site no longer adds the Tailwind Vite plugin: the integration adds it unless the Site already has it. Only the Theme's stylesheet imports Tailwind, so each page loads Tailwind's base styles once. The Starter Site drops what it kept from before the Theme had pages (its plugin, stylesheet, layout, pages and test component) and keeps its sample content, which still proves Tailwind scans the Site.

## Acceptance criteria
- [ ] The integration adds `@tailwindcss/vite` unless a plugin named `@tailwindcss/vite…` is already in the Site's `vite.plugins`.
- [ ] `@tailwindcss/vite` and `tailwindcss` are in the package's `dependencies`.
- [ ] The Starter Site has no Tailwind plugin, no stylesheet, layout, pages or components of its own, and no `tailwindcss` dependency. It still builds.
- [ ] Tailwind's preflight appears exactly once in the packed install's skeleton route CSS.
- [ ] 3.1's checks still pass: the Theme-only and content-only classes reach the skeleton route's CSS.
- [ ] The README says Site stylesheets never import Tailwind, and use `@reference` instead.

## Public contract
None. A Site that keeps its own Tailwind plugin still works.

## Seams and test list
Seam: the `astro:config:setup` hook (from 01), plus the packed-install harness.
- [ ] The hook adds the Tailwind plugin when the Site has none
- [ ] The hook adds no Tailwind plugin when the Site already has one
- [ ] Harness: preflight appears once in the skeleton route's CSS

Build and smoke checks: the harness check above, and 3.1's class checks.
Manual checks: the skeleton route is styled in `astro dev`.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
