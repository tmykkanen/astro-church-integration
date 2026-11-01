# PRD: Astro Church as an installable integration

> **Status: approved** (2026-10-31). Terms are defined in [GLOSSARY.md](../../GLOSSARY.md), decisions in [docs/adr](../adr/), evidence in [docs/research](../research/).
> Requirements were decided during discovery (see the decision log in the appendix). NFR-3 and DX-2 were proposed while drafting and accepted when the PRD was approved.

## 1. Product overview and vision
Astro Church is a church-website Theme for Astro. It is fast, Markdown-based, and non-developers can edit it through a git-based CMS. Today it exists only as code copied into each Site. This project turns it into an npm package, `astro-church`, that a Site installs as an Astro integration. The church owns its content. The Theme's pages, components, styles, content schemas and CMS configuration arrive, and are updated, through the church's package manager.

**Vision:** a church's website is *its content plus a dependency*. Fixes and new Features reach every church through `npm update`, and the low-code editing experience survives every update.

## 2. Problem statement
Astro Church is distributed by copying. The published `astro-church` template is installed with `npm create astro -- --template`. The maintained version lives inside the Sojourners Church site (`sojourners.church`, Astro 7 + Sveltia CMS). A church that adopts the Theme gets a copy of the code, and once it customizes that copy it can't receive fixes or Features. Even Sojourners maintains the Theme by editing its own Site. A forked codebase per Site also wears down the Theme's promise to Site Editors that no coding experience is required.

The original Astro Theme Provider tried to solve this in general. It has been unmaintained since January 2025 and does not run on Astro 7 ([research](../research/original-atp-analysis.md)). We chose to convert this one Theme by hand rather than build a framework (ADR-0002).

**Source for the conversion:** `sojourners.church` ([research](../research/source-theme-sojourners-church.md)).

## 3. Target users and personas
| Persona | Who | What they need from the product |
|---|---|---|
| **Theme Author** | Tyler. Maintains and publishes the Theme, and writes its code by hand. | A Theme codebase separate from any Site; a fast dev loop; confidence that what is published works |
| **Site Developer** | Installs, configures and deploys a Site. For the MVP, this is Tyler for Sojourners. | A minimal Site with one-line wiring; updates through `npm update`; clear errors |
| **Site Editor** | A non-developer who maintains content and settings in the CMS | An unchanged CMS workflow; turning Features on and off without a developer |

**MVP audience:** Sojourners. Outside churches are the first post-MVP milestone.

## 4. User needs and jobs to be done
- **Site Developer:** "When the Theme gets a fix, I want it on our site by updating one dependency, without merging code."
- **Site Developer:** "When I start a church site, I want a working Site from one command and a few settings."
- **Site Editor:** "I want to add this week's sermon, change the homepage, or add a calendar page from the CMS, without asking a developer."
- **Site Editor:** "I want to adjust our colors without editing code."
- **Theme Author:** "I want to change the Theme in one place and know it still installs and builds correctly for every Site."

## 5. Core use cases and workflows
1. **Start a new Site:** `npm create astro -- --template tmykkanen/astro-church-integration/starter`, then set `.env` and the CMS repo, then deploy to Netlify.
2. **Add the Theme to an existing project** (documented, not optimized): run `astro add astro-church`, then create `src/content.config.ts`, `src/actions/index.ts` and the content folders by hand.
3. **Update a Site:** `npm update astro-church`. Patch and minor releases need no file edits. Breaking releases come with manual migration notes.
4. **Edit content and settings:** the Site Editor uses `/cms`, which the Theme serves. The git commits trigger a deploy.
5. **Enable a Feature:** the Site Editor adds a Feature navigation entry, with an optional custom slug. Its routes then produce pages, with no code change (ADR-0003).
6. **Rebrand:** the Site Editor writes token overrides in the CMS custom CSS field. A Site Developer can add stylesheets through an integration option.
7. **Develop the Theme:** the Theme Author works in the workspace package against the Starter Site, plus a gitignored local snapshot of Sojourners content for realistic testing.
8. **Cut Sojourners over:** on a branch of `sojourners.church`, replace the Theme code with the package. Verify it on a Netlify deploy preview, then merge.

## 6. Functional requirements (MVP)
### Integration and packaging
- **FR-1** The package `astro-church` default-exports an Astro integration function. A Site enables the Theme by adding it to `integrations`.
- **FR-2** The integration injects all Theme routes: the homepage, every Feature route, Markdown pages, `robots.txt`, and the CMS. Each Feature route produces pages only when its Feature is enabled in content (ADR-0003).
- **FR-3** The integration adds what the Theme's own code needs: `astro-icon`, sitemap, the Tailwind Vite plugin, fonts and `env.schema`. It reuses any of these the Site already added. Only `astro` is a peer dependency.
- **FR-4** All Theme pages are prerendered. Only Actions run on demand.
- **FR-5** The package exports `collections` from `astro-church/content` and `server` from `astro-church/actions`, and a Site re-exports each with one line (ADR-0004). A Site can extend or override individual collections by spreading and replacing keys.
- **FR-6** Tailwind generates the classes used both in the Theme's own files (which sit inside `node_modules`) and in the Site's content.

### Features (strict parity with `sojourners.church`)
- **FR-7** Sermons: listing, entry pages, search, and filters for series, preacher, scripture and date, plus media embeds.
- **FR-8** Blog: listing, entry pages, tags.
- **FR-9** Calendar (Google Calendar), enabled through navigation.
- **FR-10** Team (people).
- **FR-11** Markdown pages and navigation: groups, pages, Features, external links.
- **FR-12** Homepage (hero, call to action), header, and footer (sections, socials, giving).
- **FR-13** Subscribe form, through an Action backed by Resend, toggled in settings.
- **FR-14** When an enabled Feature's required env vars are missing, the build fails with a clear message naming the missing variable. This is current behavior.

### CMS
- **FR-15** The integration serves Sveltia CMS at `/cms`: the admin page, every field config file, and the scripture field with its validator.
- **FR-16** The Site Developer provides the CMS backend repo through an integration option. Nothing else about the CMS is configured in the Site.
- **FR-17** In every release, the CMS config matches the Theme's schemas.

### Customization
- **FR-18** The Site Editor's `customCss` setting is applied after the Theme's styles, so it can override design tokens, with no pre-build script.
- **FR-19** A Site Developer can provide stylesheets through an integration option. They load after the Theme's styles.
- **FR-20** A Site needs no pre-build scripts.

### Starter Site
- **FR-21** The repo contains a Starter Site that can be used with `create-astro`. It has generic sample content, the Netlify adapter, the Netlify `site` URL logic, and the minimum Site files.
- **FR-22** The Starter Site is the Theme Author's development playground.

## 7. Non-functional requirements
- **NFR-1 Compatibility:** peer `astro ^7.0.0` (exact minimum set in the spec); Node `>=22.12`.
- **NFR-2 Hosting:** the Theme works with any adapter that supports on-demand rendering, but requires one. It never sets the adapter itself. Netlify is the only tested host.
- **NFR-3 Performance:** a converted Site ships no more client JS or CSS per page than `sojourners.church` does today.
- **NFR-4 Dependencies:** no runtime dependency on a theme framework or on `astro-integration-kit`. The integration is written against Astro's own API.
- **NFR-5 Quality:** see §8a.

## 8. Developer experience requirements
- **DX-1** All the code a Site needs for the Theme is the integration call in `astro.config` plus two one-line re-export files.
- **DX-2** Integration options are validated when dev or build starts. An invalid option fails with a message naming the option and the expected value.
- **DX-3** Integration options and the re-exported modules are fully typed in the Site. `astro sync` and `astro check` pass on the Starter Site.
- **DX-4** The README documents installation, the two re-export files, integration options, env vars, the public contract (§9) and upgrade notes. It is the MVP's documentation.
- **DX-5** Changes to the Theme package show up in the Starter Site's dev server without reinstalling.

### 8a. Quality requirements
1. The existing `sojourners.church` unit tests move into the package and pass. They may be adapted, but only with the Theme Author's approval.
2. CI builds the Starter Site against the package on every PR (`astro check` and `astro build`).
3. CI installs the **packed** tarball (`pnpm pack`) into the Starter Site and builds it.
4. Smoke checks on the built Starter Site: every Feature route renders, `/cms` and its config files exist, and the expected URL set is produced.
5. Manual checks: URL parity against the Sojourners snapshot, and the CMS workflow.
6. Browser end-to-end tests are out of the MVP.

## 9. Technical constraints
- **Public contract:**
  - integration options
  - entry points (`astro-church`, `astro-church/content`, `astro-church/actions`)
  - collection names, content paths, schemas, and navigation and Feature types
  - env var names
  - URLs: default slugs and the shape of entry URLs
  - the CMS editing experience
- **Breaking change:** after `npm update`, an existing valid Site fails to build, its content fails validation, or its URLs change. Adding optional fields, Features or collections is not breaking.
- **Versioning:** 0.x through the MVP. Breaking changes bump the minor version, and Sojourners pins `~0.x`. 1.0 comes at the outside-church milestone.
- **Package:** `astro-church` on npm, MIT license.
- **Integrations can't provide collections or Actions,** so the Site must keep `src/content.config.ts` and `src/actions/index.ts` (ADR-0004, [research](../research/integration-capabilities.md)).
- **Actions require an adapter,** and the actions file always exists, so every Site needs one.
- **`astro` must be a peer dependency of the package,** or the `astro:*` virtual modules won't resolve inside it.
- **Tailwind v4 doesn't scan `node_modules`,** so the Theme must declare `@source` for its own files. Site content contains Tailwind classes and must be scanned too.

## 10. Scope and non-goals
**MVP:** everything in §6, plus migrating Sojourners onto the package.

**Explicit non-goals for the MVP:**
- a general theme framework (ADR-0002)
- multiple Themes per Site, Section Themes, component kits
- component overrides
- Site-level customization of CMS fields
- adapter-free static hosting
- a custom init CLI
- new Features
- automated content migrations
- a docs-site rewrite
- a migration path for users of the old `astro-church` template
- browser end-to-end tests

## 11. Success criteria
1. `sojourners.church` runs in production on a published `astro-church` version, and the Site contains **no Theme code**. It contains only the minimal Site files plus integrations specific to Sojourners, such as `astro-resend-router`.
2. A fresh copy of the Starter Site builds and deploys with no edits beyond `.env` and the CMS repo setting.
3. A Theme fix released as a patch reaches Sojourners through `npm update` alone, with no file edits in the Site.
4. Sojourners' Site Editors see no change in their CMS workflow.
5. Before cutover, a build of `sojourners.church` produces the same set of URLs as the pre-cutover production build.

**Post-MVP milestone:** a church that has never seen the code can go from the Starter Site to a deployed site using only the docs.

## 12. Risks and open questions
**Risks.** Each one is closed by a spike before the spec is written.
- **R-1 Collections re-export:** ~~it's unverified that a Site can re-export a complete `collections` object defined in a package, in dev and build and with types.~~ Closed 2026-11-01: it works, with conditions carried into the spec (`docs/research/spike-r1-collections-reexport.md`). ADR-0004 stands.
- **R-2 Actions re-export:** it's unverified that re-exporting `server` from the package works, including types and the subscribe form.
- **R-3 CMS from the package:** it's unverified that Sveltia correctly loads the injected config endpoints plus a separate backend-only file.
- **R-4 Dev reload:** edits to the package's collections or actions files may not hot-reload in the Starter Site. This affects DX-5.
- **R-5 Two codebases during the freeze:** urgent fixes made in `sojourners.church` must be ported to the package as they happen.
- **R-6 Stale content cache on Theme upgrades** (found by the R-1 spike): Astro revalidates cached content only when the Site's `content.config.ts` text, the Astro config or the Astro version changes. A Theme release that changes a schema changes none of these, so a Site with a cached store (Netlify caches `node_modules/.astro`) could deploy content validated against the old schema, with no error. Mitigation, tested: the integration adds the Theme's version to `env.schema`, which changes the Astro config digest on every release. This relies on undocumented Astro internals, so the spec adds a smoke check for it.

**Open questions:**
- How often is the Site Developer also the Site Editor? Deferred to the post-MVP milestone.
- What happens to the old `tmykkanen/astro-church` template repo and the docs site (post-MVP).
- How the editor's custom CSS is applied. The recommendation is to inline it from `config:theme` in the base layout; the spec decides.

## 13. Dependencies and assumptions
- **Astro 7's integration API:** `injectRoute`, plus `updateConfig` merging `env.schema` and `fonts`.
- **Sveltia CMS** (loaded from a CDN) and its support for multiple config files.
- **Netlify** for hosting and deploy previews.
- **Assumption:** the Theme code in `sojourners.church` contains nothing specific to Sojourners. Checked on 2026-10-31.
- **Assumption:** content paths and collection names stay as they are, so Sveltia's commits to `main` don't conflict with the cutover branch.

## 14. Potential future capabilities
- Onboarding for outside churches: docs, a stability promise, 1.0.
- Component overrides for a short, documented list of components.
- The Site Developer choosing which Features are *available* (ADR-0003).
- Adapter-free static hosting for Sites that don't use subscribe.
- Automated content migrations (codemods).
- Generating the Sveltia field config from the Zod schemas.
- Section Themes, and extracting a reusable theme framework (ADR-0002).

## Appendix: decision log
| Decision | Ref |
|---|---|
| Convert Astro Church into a hand-written integration; no framework | ADR-0002 (supersedes ADR-0001) |
| One full-site Theme per Site | ADR-0001 → ADR-0002 |
| Work in the new repo `astro-church-integration` (from florian-lefebvre/astro-integration-template); July spikes kept as reference | Discovery |
| `sojourners.church` (Sveltia) is the source, not the `astro-church` template | Discovery |
| Features are enabled through content; all Feature routes are always injected | ADR-0003 |
| The Theme owns and exports complete `collections` | ADR-0004 |
| R-1 closed; the Theme also exports each collection's schema; the version goes into `env.schema` to bust the content cache | R-1 spike (2026-11-01) |
| The Theme serves the whole CMS; the Site provides only the backend repo | Discovery Q5 |
| Customization: content, editor custom CSS, developer stylesheets; overrides deferred | Discovery Q6 |
| Starter Site through `create-astro`, which doubles as the playground; `astro add` documented | Discovery Q7 |
| MVP audience is Sojourners; success criteria in §11 | Discovery Q8 |
| The Theme brings its own integrations | Discovery Q9 |
| Requires an adapter, prerenders its pages, tested on Netlify | Discovery Q10 |
| 0.x versioning with a defined public contract | Discovery Q11 |
| Strict parity, Theme-code freeze, cutover on a branch, local content snapshot | Discovery Q12 |
| Quality bar in §8a | Discovery Q13 |
| Package name `astro-church`, MIT | Discovery Q14 |
| Developer-led: the Theme Author writes the production code | Discovery |
