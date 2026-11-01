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
- **R-2, actions re-export:** the playground's `src/actions/index.ts` re-exports `server` from the package. Check the types and a form submission. This needs an adapter.
- **R-3, CMS served from the package:** inject `/cms` and `/cms/config/[file].yaml`, and add a separate backend-only config file. Check that Sveltia loads all of them.
- **R-4, dev reload:** watch it during all three spikes. Do edits inside the package hot-reload in the playground? So far (R-1): package edits reach the editor but not the running dev server. Details are in the R-1 note, under finding 4.

Useful references: `docs/research/integration-capabilities.md` and the July spikes in `~/Repos/@tmykkanen/astro-church-integration-spikes/`.

## 3. Technical spec, in dependency order

1. **Package skeleton and publishing:** `exports`, `files`, how `.astro`/CSS/client scripts ship (a tsdown copy step or raw source), Tailwind `@source`, and the `#/` alias moving to package.json `imports`.
2. **Integration core:** the options schema (`cms.repo`, `customCss`), route injection, bundled integrations (`astro-icon`, sitemap, Tailwind), `env.schema` and fonts, and env checks for enabled Features (replacing `verifyRequiredEnvVars`).
3. **Content contract:** collections and schemas move into the package, and the public-contract rules (PRD §9) are written down.
4. **Feature migration**, one Feature at a time: sermons, blog, calendar, team, pages, homepage and layout, subscribe and giving.
5. **CMS serving:** the admin page, the config endpoints, the scripture widget, and the validator built by the package.
6. **Customization:** the editor's `customCss` (recommended: inline it from `config:theme`) and the developer stylesheet option.
7. **Starter Site and CI:** generic sample content, the Netlify setup, the packed-tarball build and the smoke checks (PRD §8a).
8. **Sojourners cutover plan:** a branch with a deploy preview, the URL-parity check, and the local content snapshot.

## 4. Tickets

Write tickets from the spec, sized for one to three sessions each, and reference PRD requirements by number instead of repeating them.
