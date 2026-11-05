# 06: `/robots.txt` is served from the integration's route table

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-2, FR-4, §9 · **ADRs:** 0003
**Blocked by:** 01 (`site` is required), 04 (sitemap)
**Status:** ready-for-human

## Behaviour
Every Site serves `/robots.txt`, which allows crawling and points at `sitemap-index.xml` on the Site's own URL, as `sojourners.church` does today. The integration injects its routes from a single route table in which every route is prerendered. The table holds `/robots.txt` and the skeleton route, and Feature routes (3.4) and `/cms` (3.5) join it later.

## Acceptance criteria
- [ ] The integration injects every route from one route table, each with `prerender: true`.
- [ ] `/robots.txt` ports `sojourners.church`'s endpoint unchanged: `User-agent: *`, `Allow: /`, and `Sitemap:` set to `sitemap-index.xml` resolved against `site`.
- [ ] The skeleton route is still injected, from the same table.
- [ ] The packed install's `/robots.txt` points at `sitemap-index.xml` under the Starter Site's `site`.

## Public contract
Adds the URL `/robots.txt` (PRD §9), matching the source; needs a changeset.

## Seams and test list
Seam: the `astro:config:setup` hook (from 01), plus the packed-install harness.
- [ ] The hook injects `/robots.txt` and the skeleton route, each prerendered
- [ ] Harness: `robots.txt` exists, and its `Sitemap:` line is `sitemap-index.xml` under `site`

Build and smoke checks: the harness check above.
Manual checks: `/robots.txt` in `astro dev`.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments
