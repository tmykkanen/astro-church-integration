# Next steps after discovery

Discovery finished on 2026-10-31. The approved [PRD](prd/PRD.md), the [ADRs](adr/), the [glossary](../GLOSSARY.md) and the [research notes](research/) hold every decision made so far. This file covers what comes next, in order. Delete or update it as the steps get done.

**Working model:** Tyler writes all production code by hand. The agent guides, plans, drafts tests and reviews. The modes are in [`AGENTS.md`](../AGENTS.md) and the process is in [`docs/workflow.md`](workflow.md), both adapted from Steward. The agent may suggest changes to the existing tests but rewrites them only with Tyler's approval.

## 1. Set up the workflow (agent drafts, Tyler reviews)

- [x] **`AGENTS.md`:** modes, hint ladder, production/test/docs boundaries, pointers. Reviewed 2026-11-01.
- [x] **`docs/workflow.md`** and **`docs/agents/`** (issue tracker and ticket template, triage labels, domain docs). Reviewed 2026-11-01; ticket branches are now `t/<spec>-NN`, since ticket numbers restart per spec.
- [x] **The hook:** `.claude/hooks/guard-production.mjs` plus `.claude/settings.json`; `.claude/exception` is gitignored. It treats only `.md` as docs; widen it in the Starter Site spec if sample content uses other formats.
- [x] **Glossary kept as `GLOSSARY.md`**, which is what the installed skills (v1.3.1) expect. Steward predates that and uses `CONTEXT.md`.
- [x] **Agent's template TODOs (2026-11-01):** MIT `LICENSE` (Tyler Mykkanen), both READMEs, root `package:dev` filter, `ci.yml` filter plus a `pnpm lint` step, `release.yml` owner check.
- [x] **Tyler's template TODOs:**
  - [x] Rename the folder to `packages/astro-church/`.
  - [x] In `packages/astro-church/package.json`: `name`, the `TODO:` fields (author Tyler Mykkanen; repo `github.com/tmykkanen/astro-church-integration`) and the peer range `astro ^7.0.0`.
  - [x] `name` in `src/integration.ts`, the dependency in `playground/package.json` and the import in `playground/astro.config.mjs`.
  - [x] `pnpm install`, `pnpm lint`, `pnpm --filter astro-church build`.
  - [x] The first commit (`b321f33`), pushed to `github.com/tmykkanen/astro-church-integration`.
- [x] **Lefthook (2026-11-01):** `lefthook.yml` (pre-commit: Biome on staged files; pre-push: lint and package build), `lefthook: true` under `allowBuilds`. Editor settings (`.vscode/`, `.zed/`) are committed.
- **Temporary repo name:** the GitHub repo is `tmykkanen/astro-church-integration` because `astro-church` still holds the current Theme. When that repo is retired and this one takes the name, update `repository`, `bugs` and `homepage` in the package's `package.json`, plus the LICENSE link in the package README.

## 2. Spikes (Tyler builds, agent helps)

These close PRD risks R-1 to R-3 before the spec is written. They don't depend on each other, and each should take about one session. Keep spike code out of `main` (for example on `spike/<name>` branches) and record each result in `docs/research/`.

- [x] **R-1, collections re-export (2026-11-01):** passes; ADR-0004 stands. Results, the new risk R-6 (stale content cache) and the six items carried into the spec are in `docs/research/spike-r1-collections-reexport.md`. Code is on `spike/collections-reexport`.
- [x] **R-2, actions re-export (2026-11-02):** passes; ADR-0004 stands. Decided: Theme actions join the public contract, and Sites check their `server` against an exported type with `satisfies`. Results, the five findings and the eight items carried into the spec are in `docs/research/spike-r2-actions-reexport.md`. Code is on `spike/actions-reexport`. Still open there: a build with `@astrojs/netlify`, a deliberate R-4 pass, a missing secret at build time, and the real subscribe action.
- [x] **R-3, CMS served from the package (2026-11-02):** passes. The admin page is an endpoint (not an `.astro` page, which Sveltia warns against in dev), with a pattern that switches on `command`. The configs and the backend file are injected routes. The scripture field is bundled by a second tsdown config and served through a `?raw` import, with the real parser. Results, seven findings and ten items carried into the spec are in `docs/research/spike-r3-cms-from-package.md`. Code is on `spike/cms-from-package`. Still open there: a Netlify build, the published package, and R-4 through `pnpm dev`'s watcher.
- [x] **R-4, dev reload (closed 2026-11-03 with accepted limits):** package edits reach the editor but not a running `astro dev`; action edits need a restart; a rebuilt `?raw` bundle arrives without one. See the PRD risk table. The dev loop is now part of spec 3.1.
- **Spike leftovers moved into spec areas (2026-11-03):** the packed package and the `pnpm dev` watcher go to 3.1; a missing secret at build time to 3.2; the real subscribe action to 3.4; the Netlify build to 3.7.

Useful references: `docs/research/integration-capabilities.md` and the July spikes in `~/Repos/@tmykkanen/astro-church-integration-spikes/`.

## 3. Technical spec, in dependency order

One spec per area. Each area lists the items its spec must settle. `R-1 #2` means item 2 under "Carried into the spec" in that spike's note.

1. **Package skeleton and publishing:** spec written 2026-11-03 (`.scratch/package-skeleton/spec.md`, ADR-0005: the package ships its source). Its carried-items table records each outcome; R-1 #1, #5 and R-2 #7 are no longer needed. Tickets 01–08 written 2026-11-03, plus 09 (the no-globals tests on Vitest) after 06; 01–06 resolved. Unblocked next: 07 and 09.
   Original scope: `exports`, `files`, how `.astro`/CSS/client scripts ship (a tsdown copy step or raw source), Tailwind `@source`, and the `#/` alias moving to package.json `imports`.
   - Carried: R-1 #1, #5, #6; R-2 #5, #7, #8; R-3 #2, #4, #5, #9. Also: the packed package (R-3 leftover), the dev loop and `pnpm dev`'s watcher (R-4), and `pnpm verify`.
2. **Integration core:** the options schema (`cms.repo`, `customCss`), route injection, bundled integrations (`astro-icon`, sitemap, Tailwind), `env.schema` and fonts, and env checks for enabled Features (replacing `verifyRequiredEnvVars`).
   - Carried: R-2 #4 (now under 3.1's rule of no ambient globals in shipped `src/`), #6; R-3 #7. Also: a missing secret at build time (R-2 leftover), and which stylesheet owns `@import "tailwindcss"` so a page never loads Tailwind's base styles twice (NFR-3; from 3.1 ticket 03).
3. **Content contract:** collections and schemas move into the package, and the public-contract rules (PRD §9) are written down.
   - Carried: R-1 #2, #3, #4; R-2 #2. Also: the type probe's check that collection entry `data` isn't `any` (from 3.1's harness), and a real type for `collections` instead of 3.1's `{}` (3.1 ticket 04). Also: whether the ported tests that `vi.mock('astro:content', …)` run under the package's plain Vitest config or need Astro's plugins; `getViteConfig` with no Astro config fails on `src/actions.ts` (3.1 ticket 06).
4. **Feature migration**, one Feature at a time: sermons, blog, calendar, team, pages, homepage and layout, subscribe and giving.
   - Carried: R-2 #1, #3. Also: the real subscribe action (R-2 leftover). From 3.1 ticket 06: the Site half of its AC 7 (the Site's `astro check` sees `scriptureParsing` once an exported module imports it, with no TS7016), and three inherited `expandRange` bugs kept for parity (multi-chapter ranges expand only the first chapter, ranges across books give `[]`, comma lists come back unsplit) for a post-MVP decision. From 3.1 ticket 04: the probe that a `server` missing a Theme action fails `satisfies ThemeActions`; `serverWithSiteAction` starts to bite once `server` has an action; closing `ThemeActions` or narrowing its `unknown` index signature is breaking.
5. **CMS serving:** the admin page, the config endpoints, the scripture widget, and the validator built by the package.
   - Carried: R-3 #1, #3, #6, #8.
6. **Customization:** the editor's `customCss` (recommended: inline it from `config:theme`) and the developer stylesheet option.
7. **Starter Site and CI:** generic sample content, the Netlify setup, the packed-tarball build and the smoke checks (PRD §8a).
   - Carried: R-3 #10. Also: a Netlify build (R-2 and R-3 leftovers), replacing the Starter Site's interim `@astrojs/node` adapter, and whether sessions (which `@astrojs/node` turns on with filesystem storage) stay on (3.1 ticket 04).
8. **Sojourners cutover plan:** a branch with a deploy preview, the URL-parity check, and the local content snapshot.

## 4. Tickets

Write tickets from the spec, sized for one to three sessions each, and reference PRD requirements by number instead of repeating them.
