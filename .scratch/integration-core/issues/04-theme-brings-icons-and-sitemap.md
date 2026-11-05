# 04: The Theme brings `astro-icon` and sitemap

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-3 · **ADRs:** 0002
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
A Site gets icons and a sitemap without installing or configuring either. The integration adds `astro-icon` and `@astrojs/sitemap` unless the Site already added them, in which case the Site's copy and its options win. Theme icons render in a packed pnpm install, where the Theme's icon sets sit in the Theme's dependencies, not the Site's.

## Acceptance criteria
- [ ] **Risk, checked first:** an icon from a Theme-owned `@iconify-json/*` set renders on the skeleton route in a packed pnpm install. If it doesn't, decide the fallback (icon sets as peers, or inline SVGs) and record it here and in the spec before going on.
- [ ] The integration adds `astro-icon` and `@astrojs/sitemap` only when the Site's `integrations` has no entry with that name.
- [ ] `astro-icon`, `@astrojs/sitemap` and the Theme's `@iconify-json/*` sets are in the package's `dependencies`.
- [ ] The packed install emits `sitemap-index.xml`.
- [ ] The README tells a Site that brings its own `astro-icon` to keep the Theme's icon sets included.

## Public contract
None.

## Seams and test list
Seam: the `astro:config:setup` hook (from 01), plus the packed-install harness.
- [ ] The hook adds both integrations when the Site has neither
- [ ] The hook skips an integration the Site already has, and adds the other
- [ ] Harness: the skeleton route's icon renders
- [ ] Harness: `sitemap-index.xml` exists

Build and smoke checks: the two harness checks above.
Manual checks: the icon shows in `astro dev`.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
