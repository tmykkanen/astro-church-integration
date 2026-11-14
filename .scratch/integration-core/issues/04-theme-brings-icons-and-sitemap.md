# 04: The Theme brings its icons and sitemap

**Spec:** `.scratch/integration-core/spec.md` (Icons; Bundled integrations) · **PRD:** FR-3, NFR-3, §9 · **ADRs:** 0002 · **Research:** `docs/research/icons-from-the-theme.md`
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
A Site gets a sitemap and the Theme's icons without installing or configuring anything. The integration adds `@astrojs/sitemap` unless the Site already added it, in which case the Site's copy and its options win. The Theme renders social icons itself from its own `@iconify-json/simple-icons`, so they work in a packed pnpm install with nothing in the Site's `package.json`. A social icon name that isn't in the set fails the build with a message naming it.

The original first step, checking whether `astro-icon` could render a Theme-owned icon set, failed on 2026-11-09. The Theme doesn't use `astro-icon`; see the research note.

## Acceptance criteria
- [x] A Theme component renders a `simple-icons` icon by name (the names `astro-icon` accepted, e.g. `youtube`) as an inline `<svg>` at build time, from the Theme's own `@iconify-json/simple-icons`, with no client JS.
- [x] Its markup is close enough to `astro-icon`'s (`viewBox`, `1em` size, `currentColor`) that `sojourners.church`'s social button styles still apply.
- [x] An unknown name throws an error naming the name and pointing at https://simpleicons.org/, so a prerendered page fails the build.
- [x] The skeleton route renders one social icon, and it renders in a packed pnpm install.
- [x] The integration adds `@astrojs/sitemap` only when the Site's `integrations` has no entry with that name.
- [x] `@astrojs/sitemap`, `@iconify-json/simple-icons` and `@iconify/utils` are in the package's `dependencies`; `astro-icon` and `@iconify-json/lucide` aren't.
- [x] The integration doesn't add `astro-icon`.
- [x] The packed install emits `sitemap-index.xml`.
- [x] Whether `icons.json` is imported (bundled into the server build) or read from disk at build time is decided and recorded under Comments.

## Public contract
No new export. The social icon names a Site writes in `socials[].icon` stay the same as with `astro-icon` (the `@iconify-json/simple-icons` names), so nothing breaks. From now on, a bump of `@iconify-json/simple-icons` that removes a name is a breaking change (PRD §9).

## Seams and test list
Seams: the social icon lookup (plain Vitest), the `astro:config:setup` hook (from 01), and the packed-install harness.
- [x] The lookup returns an `<svg>` for a known name (`youtube`)
- [x] The lookup follows an alias in the set, and returns the alias's icon
- [x] The lookup throws for an unknown name, and the message names it and simpleicons.org
- [x] The hook adds sitemap when the Site has none
- [x] The hook skips sitemap when the Site already has it
- [x] The hook doesn't add `astro-icon`
- [x] Harness: the skeleton route's social icon renders as an inline `<svg>`
- [x] Harness: `sitemap-index.xml` exists, is under the Site's `site` and lists the skeleton route

Build and smoke checks: the two harness checks above.
Manual checks:
- The icon shows in `astro dev`.
- Its markup, set beside `sojourners.church`'s built footer icon for the same name, has the same `viewBox` and sizing.
- With an unknown name on the skeleton route, `astro build` fails with the message (revert afterwards).

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible
- [x] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
- 2026-11-09: the `astro-icon` risk check failed. `astro-icon` (and its fork `astro-iconset`) finds icon sets only through the Site's `package.json` and resolves them from the Site's folder. Decided with Tyler: drop `astro-icon`, read `@iconify-json/simple-icons` directly, fail the build on an unknown name. The PRD (FR-3 and the decision log) and the spec's Icons section were updated. Details: `docs/research/icons-from-the-theme.md`.
- **Criteria to checks (2026-11-14).** 1: `tests/lib/socialIcon.test.ts` (known name, alias, distinct icons) and the harness's icon check; no client JS because the component renders at build time. 2: the harness checks `width`/`height` `1em` and `viewBox="0 0 24 24"`; the markup was compared by hand with `sojourners.church`'s footer icon (Tyler). 3: the unknown-name test checks the `AstroError` message and hint; the build failing was checked by hand (Tyler). 4: the harness's icon check, on a packed install whose Site has no `@iconify-json` set. 5: `tests/integration/sitemap.test.ts` (added when the Site has none; not added when the Site has its own, with options). 6: `package.json`, read by hand. 7: `tests/integration/icons.test.ts`. 8: the harness's sitemap check, which also checks the index's sitemaps are under `site`, built, and list `/theme-skeleton`. 9: the next comment. Manual check: the icon shows in `astro dev` (Tyler).
- **Icon data is imported, not read from disk.** `socialIcon.ts` imports `icons` from `@iconify-json/simple-icons` (its main entry, already typed, so no JSON import or `tsconfig` change). The whole set (about 4.6 MB) goes into the server build; no client JS ships, since pages are prerendered. Reading from disk stays an option if build size matters later, and the lookup's interface wouldn't change.
- **Markup differs from `astro-icon` on purpose.** `astro-icon` put the body in a `<symbol>` with a `<use href>` so repeats share one copy. `SocialIcon.astro` puts the body inline in the `<svg>`. The visible result and the attributes (`width`, `height`, `viewBox`, `data-icon="simple-icons:<name>"`) match, and each social icon appears at most once or twice per page.
- **Red first.** "Adds sitemap when the Site has none" failed first (the hook added no integrations), then failed again for a second reason: the first implementation added the sitemap as a Vite plugin. The lookup's three tests, the "skips sitemap", "doesn't add `astro-icon`" tests and both harness checks were written after the code and passed on their first run; this was expected, since Tyler wrote `socialIcon.ts` from the rung-4 hint before the tests.
- **Test helper.** `tests/integration/setup.ts` gained an optional `integrations` for `setupParams` (default `[]`, as in Astro's resolved config) and the shared `addedIntegrationNames`.
- **Public contract.** No new export. Additive for Sites: they may drop their own `@astrojs/sitemap`, and need no icon integration or set for the Theme (changeset `theme-brings-sitemap`, README "Sitemap" and "Icons").
- **Ticket 03's open items.** "One named function per concern" was done in `1174db9`. The shared "Site already has a plugin named…" helper isn't needed: sitemap looks in `config.integrations` by exact name, which is simpler than Tailwind's `vite.plugins` search.
- **Review (2026-11-14).** Fixed in tests: the harness's stale `astro-icon` comment and header wrap; `validOptions`, `validSite` and `addedPluginNames` moved into `tests/integration/setup.ts` beside `addedIntegrationNames` (touches ticket 01–03 tests; moves only, approved by Tyler); a table-driven test that the published icon names (Sojourners' four, plus `linkedin` and `twitter`) still resolve, so a lockfile bump that drops one fails CI. Tyler dropped `addSitemap`'s redundant guards (`config.integrations` is a flattened `AstroIntegration[]`). Kept as is: the `patch` changeset (PRD §9: only breaking changes bump the minor in 0.x), `SocialIconSvg` as the Theme's own type, the `socialIcon` name. Footprint: a fresh Starter Site build has no added client JS, and the icon set isn't in `dist/server`, since Astro drops the prerender chunk; this holds while every page using `SocialIcon` is prerendered (FR-4). Logged, not fixed: nothing asserts that the Site's sitemap *options* win (true by construction, since the Theme adds nothing), and the "doesn't add `astro-icon`" guard passes against an empty hook.
