# Research: the source theme (`sojourners.church`)

The working source for the conversion is `~/repos/@sojourners/sojourners.church`, last commit 2026-08-30. It replaces the older `astro-church` template, which is out of date. Notes collected 2026-10-31 from reading the code.

## Stack
- **Astro 7** (`^7.1.6`), deployed with the Netlify adapter.
- **No UI framework:** React was removed. Interactivity uses `.astro` components plus vanilla TS `init.ts` scripts and `@data-slot/*` headless primitives (shadcn-style `ui/` components via `bejamas`).
- **Tailwind v4** through `@tailwindcss/vite`, plus typography and `tw-animate-css`.
- **Integrations in `astro.config.mjs`:**
  - `astro-icon`
  - `@astrojs/sitemap`
  - `astro-resend-router`: Tyler's own published integration. Its config holds Site-specific segment IDs and sender addresses.
- **Astro config used:**
  - the Fonts API (Poppins)
  - `env.schema` (Resend and Google Calendar keys)
  - `build.format`, `trailingSlash`
  - `site` derived from Netlify environment variables
- **Astro Actions:** `src/actions/index.ts` defines the subscribe form (`subscribeClient`).
- **Import alias:** `#/*` → `./src/*` through tsconfig `paths`, not package.json `imports`.
- **Tooling:** Vitest tests (`tests/`), Biome, husky with lint-staged, changesets.

## Content model (`src/content.config.ts`)
- **Settings singletons**, each a YAML file in `src/content/config/` with a glob loader:
  - `config:site`: name, description, logo, favicon, socials
  - `config:homepage`: hero, CTA
  - `config:footer`: sections, subscribe, giving
  - `config:team`
  - `config:theme`: `customCss`
  - `config:nav`: navigation entries
- **Collections:** `pages`, `people`, `series`, `sermons`, `blog`.
- **Schemas** live in `src/lib/content/schemas/*`; typed getters in `src/lib/content/getters/*`.

## Features and routing
- **Navigation entries are typed:** `group`, `page`, `feature` (`featureType`: `sermons` | `blog` | `calendar` | `team`, optional `customSlug`), and `external`.
- **Feature routes are rest-param pages:** `src/pages/[...sermons]/index.astro`, `[...blog]`, `[...calendar]`, `[...team]`, `[...pages]`.
  - Their `getStaticPaths` reads the navigation entry and returns `[]` when the feature isn't in the nav.
  - So **the Site Editor turns Features on, and picks their URLs, from the CMS.**
- **Subscribe and giving** are toggled by `isActive` flags in `footer.yaml`.
- **`verifyRequiredEnvVars()`** runs in `astro.config.mjs` and reads the YAML files directly (bypassing the content layer). It requires the Resend or Calendar keys only when those Features are on.

## CMS (Sveltia)
- **Location:** `public/cms/index.html` loads Sveltia from unpkg and several config files (`public/cms/config/*.yaml`, one per collection or settings group).
- **Settings config:** `settings.yaml` holds the **Site-specific** backend (`repo: sojourners-church/sojourners.church`) and defines the settings singletons.
- **CMS field definitions mirror the Zod schemas by hand.**
- **Custom scripture field:** `public/cms/scripts/scriptureField.js`. The validator `isValid.mjs` is bundled from `src/lib/scriptureParsing/isValid.ts` by `tsdown` in `predev`/`prebuild`.
- **Custom CSS:** a CMS field (`theme.yaml` `customCss`) is written to `src/styles/generated-theme.css` by `scripts/generate-theme-css.js` in `predev`/`prebuild`.

## Implications for the conversion
- **Feature routes can always be injected:** the existing design already returns no paths for disabled Features. This works for prerendered routes; SSR needs more thought.
- **The CMS config is part of the Theme:** it mirrors the schemas, so a Theme update that changes a schema must also update the CMS config. The backend repo setting belongs to the Site.
- **Several things currently need code in the Site, not the Theme:**
  - Actions (`src/actions`)
  - the `env.schema`
  - content collections (`src/content.config.ts`)
  - the two pre-build scripts

  Whether an integration can provide each of these is a research question; for collections the answer is no ([loader reference](https://docs.astro.build/en/reference/content-loader-reference/)).
- **The `#/` alias** must become package-relative imports or package.json `imports` (`#/*`), which Node and Vite resolve natively inside a package.
