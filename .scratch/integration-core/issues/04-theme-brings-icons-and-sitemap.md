# 04: The Theme brings its icons and sitemap

**Spec:** `.scratch/integration-core/spec.md` (Icons; Bundled integrations) · **PRD:** FR-3, NFR-3, §9 · **ADRs:** 0002 · **Research:** `docs/research/icons-from-the-theme.md`
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
A Site gets a sitemap and the Theme's icons without installing or configuring anything. The integration adds `@astrojs/sitemap` unless the Site already added it, in which case the Site's copy and its options win. The Theme renders social icons itself from its own `@iconify-json/simple-icons`, so they work in a packed pnpm install with nothing in the Site's `package.json`. A social icon name that isn't in the set fails the build with a message naming it.

The original first step, checking whether `astro-icon` could render a Theme-owned icon set, failed on 2026-11-09. The Theme doesn't use `astro-icon`; see the research note.

## Acceptance criteria
- [ ] A Theme component renders a `simple-icons` icon by name (the names `astro-icon` accepted, e.g. `youtube`) as an inline `<svg>` at build time, from the Theme's own `@iconify-json/simple-icons`, with no client JS.
- [ ] Its markup is close enough to `astro-icon`'s (`viewBox`, `1em` size, `currentColor`) that `sojourners.church`'s social button styles still apply.
- [ ] An unknown name throws an error naming the name and pointing at https://simpleicons.org/, so a prerendered page fails the build.
- [ ] The skeleton route renders one social icon, and it renders in a packed pnpm install.
- [ ] The integration adds `@astrojs/sitemap` only when the Site's `integrations` has no entry with that name.
- [ ] `@astrojs/sitemap`, `@iconify-json/simple-icons` and `@iconify/utils` are in the package's `dependencies`; `astro-icon` and `@iconify-json/lucide` aren't.
- [ ] The integration doesn't add `astro-icon`.
- [ ] The packed install emits `sitemap-index.xml`.
- [ ] Whether `icons.json` is imported (bundled into the server build) or read from disk at build time is decided and recorded under Comments.

## Public contract
No new export. The social icon names a Site writes in `socials[].icon` stay the same as with `astro-icon` (the `@iconify-json/simple-icons` names), so nothing breaks. From now on, a bump of `@iconify-json/simple-icons` that removes a name is a breaking change (PRD §9).

## Seams and test list
Seams: the social icon lookup (plain Vitest), the `astro:config:setup` hook (from 01), and the packed-install harness.
- [ ] The lookup returns an `<svg>` for a known name (`youtube`)
- [ ] The lookup follows an alias in the set, and returns the alias's icon
- [ ] The lookup throws for an unknown name, and the message names it and simpleicons.org
- [ ] The hook adds sitemap when the Site has none
- [ ] The hook skips sitemap when the Site already has it
- [ ] The hook doesn't add `astro-icon`
- [ ] Harness: the skeleton route's social icon renders as an inline `<svg>`
- [ ] Harness: `sitemap-index.xml` exists

Build and smoke checks: the two harness checks above.
Manual checks:
- The icon shows in `astro dev`.
- Its markup, set beside `sojourners.church`'s built footer icon for the same name, has the same `viewBox` and sizing.
- With an unknown name on the skeleton route, `astro build` fails with the message (revert afterwards).

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
- 2026-11-09: the `astro-icon` risk check failed. `astro-icon` (and its fork `astro-iconset`) finds icon sets only through the Site's `package.json` and resolves them from the Site's folder. Decided with Tyler: drop `astro-icon`, read `@iconify-json/simple-icons` directly, fail the build on an unknown name. The PRD (FR-3 and the decision log) and the spec's Icons section were updated. Details: `docs/research/icons-from-the-theme.md`.
