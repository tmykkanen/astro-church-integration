# Spec 3.2: Integration core

**Status:** ready-for-human
**PRD:** FR-2, FR-3, FR-4, FR-14, FR-16, FR-19 (option only), DX-2, DX-3, NFR-3, §9 · **ADRs:** 0002, 0003, 0004, 0005
**Decided:** grilling session, 2026-11-05 (Q1–Q16)
**Blocked by:** spec 3.1 (resolved)

## Problem Statement

The `astro-church` integration injects only the walking skeleton's route. Everything else the Theme needs from a Site's `astro.config` is still written by hand in each Site:
- the Tailwind Vite plugin, `astro-icon` and sitemap
- the Poppins font
- the `env.schema` for the Theme's variables
- a pre-config script (`verifyRequiredEnvVars`) that parses content YAML to fail the build when an enabled Feature's variable is missing

The integration takes no options, so a Site has no typed, validated place to give the CMS repo (FR-16) or its own stylesheets (FR-19). A Site Developer installing the Theme today would have to copy all of this from `sojourners.church`. That defeats DX-1, and the whole configuration would become one more thing that drifts between Sites.

## Solution

The integration becomes the single place where the Theme configures Astro:
- It validates its options when dev or build starts, and gives errors that name the option.
- It requires `site`.
- It adds the integrations, Vite plugin, font and env fields the Theme's own code needs, reusing any the Site already added.
- It owns a route table, in which every injected route is prerendered. `robots.txt` is the first real route.

Feature env checks move from a pre-config script into the Features themselves, through a shared helper. A Site's `astro.config` shrinks to `astroChurch({ cms: { repo } })`, its adapter and its `site`. The Starter Site drops the Tailwind wiring and pages that predate the Theme.

## User Stories

1. As a Site Developer, I want to enable the Theme with one integration call and one required option (`cms.repo`), so that my `astro.config` holds nothing Theme-specific.
2. As a Site Developer, I want a missing or malformed `cms.repo` to stop dev and build with a message naming `cms.repo` and the expected `owner/name` form, so that I don't find out from a broken CMS login.
3. As a Site Developer, I want any invalid option to fail with the option's name and the expected value (DX-2), so that I can fix it without reading the Theme's source.
4. As a Site Developer, I want a missing `site` to fail at startup with a message naming `site`, so that I don't get a bare `Invalid URL` from `robots.txt` or a sitemap with no URLs.
5. As a Site Developer, I want autocomplete and type errors for the integration's options in `astro.config`, so that mistakes show up in my editor (DX-3).
6. As a Site Developer, I want to import an `AstroChurchOptions` type, so that I can build the options in a separate variable or file with full types.
7. As a Site Developer, I want to declare `customCss` stylesheets in the options now, so that the option's shape is settled before its behaviour arrives in spec 3.6.
8. As a Site Developer, I want the Theme to add `astro-icon`, sitemap and the Tailwind Vite plugin itself, so that I don't install or configure them (FR-3).
9. As a Site Developer who already uses sitemap or `astro-icon` with my own options, I want the Theme to keep my copy rather than add a second one, so that my configuration wins and nothing runs twice.
10. As a Site Developer who already adds the Tailwind Vite plugin, I want the Theme not to add another, so that the build isn't slowed or broken by two Tailwind plugins.
11. As a Site Developer, I want only `astro` (and TypeScript, NFR-1) as peer dependencies, so that one `npm install astro-church` brings everything else.
12. As a visitor, I want Tailwind's base styles loaded once per page, so that pages ship no extra CSS (NFR-3).
13. As a Site Developer writing my own stylesheet, I want a documented rule (use `@reference`, never import Tailwind), so that my stylesheet doesn't load Tailwind's base styles a second time.
14. As a visitor, I want the Theme's font (Poppins) to load without the Site configuring it, so that every Site looks like the Theme.
15. As a Site Developer, I want the Theme's env variables declared for me with their existing names, so that my `.env` and Netlify settings from `sojourners.church` keep working.
16. As a Site Developer of a Site with no calendar and no subscribe form, I want the build to succeed with no Google or Resend variables set, so that I configure only what I use.
17. As a Site Developer, I want the build to fail when a Feature is enabled in content but its variable is missing, with a message naming both the variable and the Feature (FR-14), so that I never deploy a broken calendar or subscribe form.
18. As a Site Editor, I want enabling a Feature in the CMS to stay a content-only change (ADR-0003), with any missing variable reported by the next build, so that I can tell a developer exactly what's missing.
19. As a Site Developer, I want the Theme to leave `env.validateSecrets` to me, so that the integration doesn't override a setting my Site owns.
20. As a Site Developer on Netlify, I want the README to say that Feature variables must be available to both the build and functions, so that a variable scoped only to functions doesn't slip past the build check.
21. As a Site Developer upgrading the Theme, I want each Theme version recorded in the Astro config, so that a cached content store can't survive a release that changed a schema (R-6; the smoke check comes in 3.3).
22. As a search engine, I want `/robots.txt` to allow crawling and point at `sitemap-index.xml` on the Site's own URL, so that I can find every page.
23. As a search engine, I want `sitemap-index.xml` to list the Site's prerendered pages, so that indexing matches the old Site.
24. As the Theme Author, I want every injected route listed in one route table and prerendered (FR-4), so that later specs add Feature routes and `/cms` in one known place.
25. As the Theme Author, I want the Theme's own code to import named env variables from `astro:env` and get real types, both in a Site and in the package's typecheck, without an ambient global in shipped source (3.1's no-globals rule).
26. As the Theme Author, I want a test that fails when the package's dev-only `astro:env` declaration drifts from the integration's `env.schema`, so that the typecheck never lies about the variables.
27. As the Theme Author, I want the integration's setup tested by calling its hook directly, so that option errors, reuse detection and config updates are checked in milliseconds without building a Site.
28. As the Theme Author, I want the packed-install harness to check robots, the sitemap, the font and a single copy of Tailwind's base styles, so that a published package does what the source does.
29. As the Theme Author, I want an icon to render through `astro-icon` in a packed pnpm install, so that I know the Theme's icon sets resolve when they sit in the Theme's dependencies, not the Site's.
30. As the Theme Author, I want the Starter Site stripped of its pre-Theme pages, layout, stylesheet and Tailwind plugin, so that it shows the real minimum a Site needs.

## Implementation Decisions

### Options (Q2, Q12)
- The schema uses Zod from `astro/zod` and is parsed in `astro:config:setup`. A failure throws an error whose message names each failing option path and its expected value (DX-2).
- **`cms.repo`:** a required string in the form `owner/name` (FR-16, R-3 #7). There's no `cms.branch`: parity, and adding it later is not breaking.
- **`customCss`:** an optional array of strings. It's validated and typed here, with no behaviour until spec 3.6 (FR-19).
- **`AstroChurchOptions`:** a type-only export from `astro-church`, derived from the schema's *input* type, so optional fields stay optional. The integration function's parameter uses the same type. **Public contract:** the options and this type name join PRD §9. This is additive.
- **Unknown options are rejected:** the schema and `cms` are strict objects, so a misspelt key (`customCSS`, `cms.repository`) fails with a message naming it instead of being dropped. Decided at ticket 01's review, before any release; loosening it later is additive, tightening it after a release would be breaking.
- **`site` is required:** when `config.site` is unset, `astro:config:setup` fails with a message naming `site` (Q11).

### Bundled integrations and the Tailwind plugin (Q3, Q14)
- `astro-icon` and `@astrojs/sitemap` are added through `updateConfig({ integrations })`, each only when `config.integrations` has no entry with that integration's name. The Site's copy and its options win, and the Theme passes no options to either.
- `@tailwindcss/vite` is added through `updateConfig({ vite: { plugins } })` only when no plugin in `config.vite.plugins` has a name starting with `@tailwindcss/vite`.
- These packages, plus `tailwindcss` and the `@iconify-json/*` sets the Theme uses, go in `dependencies`. Only `astro` and `typescript` are peers.
- **Risk (ticket 03):** `astro-icon` looks up icon sets from the project root, so in a packed pnpm install the Theme's sets may not resolve. The check comes first. The skeleton route renders one icon so the harness keeps checking it. If resolution fails, the ticket decides the fallback (icon sets as peers, or inline SVGs) and records it here.
- **README:** a Site that brings its own `astro-icon` must keep the Theme's icon sets included.

### Tailwind ownership (Q4, carried from 3.1 ticket 03)
- The Theme's stylesheet is the only one that imports Tailwind. Site stylesheets (FR-19, 3.6) never import it; they use `@reference` when they need the Theme's utilities or theme.
- The Starter Site loses its Tailwind Vite plugin, its own stylesheet, its layout, its pages and its test component. Its sample content stays, and it still proves that Tailwind scans the Site (3.1's harness check).

### Fonts (Q10)
- Poppins (Google provider, `--font-sans`, latin subset) is added through `updateConfig({ fonts })`. There's no option to change it.
- **Risk (ticket 02):** the research note marks "integrations can set `fonts` through `updateConfig`" as unverified. The ticket checks it first. *Checked 2026-11-09: it works on Astro 7.3.5 (see ticket 02's Comments).*
- Rendering the font (the `<Font />` component in the layout) belongs to spec 3.4. Until then, the skeleton route renders it so the harness can check it.

### Env (Q5, Q7, Q8, Q9)
- The integration adds to `env.schema` the four variables from `sojourners.church`, with their names, context and access unchanged: `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `PUBLIC_GOOGLE_CALENDAR_ID`, `PUBLIC_GOOGLE_CALENDAR_API_KEY`. **All are optional**, because a Feature is enabled by content (ADR-0003) and a Site without it must build.
  - **Why optional, and checked inside Features** (Q5, Q6): the source declares the variables required, and its pre-config script keeps that safe by parsing content YAML before Astro starts. Optional fields plus a check inside each Feature keep content validation in the content layer: there's no second YAML parser, no hard-coded content paths and no hand-loaded `.env`. The cost: in dev, a missing variable fails when the Feature's page renders, not at startup.
  - **Public contract:** the four names, and their optionality, join PRD §9 (env var names were already listed).
- **Theme version:** the integration also adds a field carrying the package version to `env.schema`. This is R-6's cache-busting mechanism (R-1 #2). Its smoke check (a schema change plus a version bump fails the build) needs a collection, so it stays in 3.3.
- **`env.validateSecrets`** isn't set by the integration: with optional fields it can't catch a missing Feature secret, and the setting belongs to the Site (R-2 #6).
- **The `requireEnv` helper (FR-14):** shared Theme code that a Feature calls when it is enabled. It takes the variable's name and value (read from `astro:env`), the Feature's name, and returns the narrowed `string`. When the value is missing it throws an error naming the variable and the Feature. Prerendered pages run at build time, so the build fails. This replaces `verifyRequiredEnvVars`. Each Feature wires it up in 3.4; this spec only provides it.
- **Missing secret at build time (R-2 leftover):** covered by the helper, since subscribe's check runs while the footer prerenders. The README notes that on Netlify, Feature variables must be scoped to builds as well as functions.
- **Typing `astro:env` in the package (R-2 #4):** shipped source imports the named variables directly. In a Site they type-check, because the integration merges `env.schema` and `astro sync` generates the module. For the package's own typecheck (`tsc` and the check-only `astro check` root), a dev-only declaration of the `astro:env/*` modules lives outside `src/`. Nothing ambient ships (3.1's no-globals rule).

### Routes (Q1, Q11)
- The integration keeps a single route table: each entry is a pattern and an entrypoint (`new URL(…, import.meta.url)`, per 3.1), injected with `prerender: true` (FR-4).
- **`/robots.txt`** is the first real route. It ports `sojourners.church`'s endpoint unchanged: allow everything, with `Sitemap:` set to `sitemap-index.xml` resolved against `site`.
- The skeleton route stays in the table until spec 3.4 removes it. Feature routes come in 3.4 and `/cms` in 3.5.
- **Public contract:** `/robots.txt` is a URL (PRD §9). It matches the source, so nothing breaks.

## Testing Decisions

Good tests here check what a Site Developer or a built Site can observe: the config the integration hands to Astro, the errors it throws, and the files a build emits. They don't check how the integration is put together inside. Assertions name the option, variable or file, not internal helper names.

**Seams (approved, Q13):**
1. **The integration's `astro:config:setup` hook, under Vitest.** Tests call the hook with a hand-built params object: a fake `config` (`site`, `integrations`, `vite.plugins`), and recording `updateConfig` and `injectRoute` functions, plus `command` and `logger`. They cover:
   - option errors naming `cms.repo`, a bad `customCss` and a missing `site`
   - the integrations and Tailwind plugin added, or left out when the Site already has them
   - the four `env.schema` fields, all optional, plus the version field
   - the Poppins `fonts` entry
   - the route table: `/robots.txt` and the skeleton route, each prerendered

   This is a new seam, and the highest point where config can be checked without a build.
2. **Plain Vitest:**
   - the dev-only `astro:env` declaration matches the integration's `env.schema` (same names; optional fields typed `string | undefined`)
   - `requireEnv` returns the value when it's set, and throws a message naming the variable and the Feature when it isn't
3. **The packed-install harness** (extends 3.1's, in CI):
   - `/robots.txt` exists and its `Sitemap:` line points at `sitemap-index.xml` under the Starter Site's `site`
   - `sitemap-index.xml` exists
   - the skeleton route's CSS sets `--font-sans` to Poppins, and the font files the route preloads are emitted. (Ticket 02 changed this from "the font files are emitted": Astro emits a configured font's files whether or not a page renders `<Font />`.)
   - Tailwind's preflight appears exactly once in the skeleton route's CSS
   - the skeleton route's `astro-icon` icon renders
4. **The type probe** (extends 3.1's): a wrong option type passed to the integration in `fixtures/type-probe.ts` fails `astro check` (under `@ts-expect-error`), and `AstroChurchOptions` isn't `any`. Ticket 01 put these probes in the existing probe file rather than a separate probe `astro.config`: same types, one file for the harness to copy.

**Carried to 3.4:** the end-to-end case where a Feature is enabled, its variable is missing and the build fails. There is no Feature to drive it here.

**Prior art:**
- The package's Vitest setup and `tests/lib/scriptureParsing.test.ts` (plain Vitest).
- `tests/checks/no-globals.test.mjs` (fixtures beside the test).
- `tests/packed/harness.mjs` and its `fixtures/type-probe.ts` (packed install and type probe).
- `tests/build/skeleton-route.mjs` (checking a built route's output).

## Tickets
`issues/01`–`06`, approved 2026-11-05. Q15's bundled-integrations ticket was split into 03 (Tailwind) and 04 (`astro-icon` and sitemap).
1. **Options:** the schema, `cms.repo`, inert `customCss`, the `site` check, `AstroChurchOptions`, DX-2 errors. Creates the hook-test seam.
2. **Fonts:** Poppins through `updateConfig`; the unverified API is checked first.
3. **Tailwind:** the plugin with reuse detection, the Starter Site cleanup, the preflight-once check.
4. **`astro-icon` and sitemap:** reuse detection; the pnpm icon-resolution risk is checked first.
5. **Env:** the optional fields, the version field, the dev-only declaration and its sync test, `requireEnv`.
6. **Route table and `robots.txt`.**

Ticket 01 comes first. Tickets 02–05 depend only on 01; 02 and 04 carry the unverified facts, so do them early. Ticket 06 is blocked by 01 (`site`) and 04 (sitemap).

## Carried items
| Item | Outcome |
|---|---|
| R-2 #4 ambient `env.d.ts` | Replaced: named imports from `astro:env`, typed in a Site by `astro sync` and in the package by a dev-only declaration outside `src/`, kept in sync by a test. |
| R-2 #6 `validateSecrets` and Feature env checks | The integration doesn't set `validateSecrets`. Feature checks run inside Features through `requireEnv`. |
| R-3 #7 a clear error for a missing `cms.repo` | Option validation (ticket 01). |
| Missing secret at build time (R-2 leftover) | Covered by `requireEnv` during prerender, plus a README note on Netlify scopes. The end-to-end test goes to 3.4. |
| Who imports Tailwind (3.1 ticket 03) | The Theme's stylesheet only; Site stylesheets use `@reference`. |
| R-1 #2 version in `env.schema` | Split: the field is added here; the cache-busting smoke check stays in 3.3. |

## Out of Scope
- Feature routes, the layout's `<Font />`, and wiring `requireEnv` into the calendar and subscribe (3.4).
- Removing the skeleton route (3.4).
- Collections, schemas, and the R-6 smoke check (3.3).
- Serving `/cms`, and putting `cms.repo` into the CMS config (3.5).
- What `customCss` does, and the editor's custom CSS (3.6).
- The Netlify adapter, the `site` URL logic in the Starter Site, and generic sample content (3.7).
- A font option, `cms.branch`, and any other new option. These are post-MVP and additive.

## Further Notes
- No glossary changes and no ADR (Q16). "Integration options" is a technical term, not a domain term. Keeping env variables optional and checking them inside Features is recorded above with its reasoning, since it's cheap to reverse.
- Changesets: tickets 01, 03, 04 and 05 change the public contract additively (options, `AstroChurchOptions`, env names, `/robots.txt`), so each needs a changeset.
- The README gains: the options, env vars and their Netlify scope, the `@reference` rule for Site stylesheets, and the `astro-icon` include note (DX-4).
