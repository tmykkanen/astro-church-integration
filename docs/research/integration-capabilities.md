# Research: what an integration can provide (Astro 7.4.4, Sveltia, as of 2026-10-31)

These findings come from reading `withastro/astro` main (7.4.4, commit 10dae2f) and `sveltia/sveltia-cms` main. `SRC` = `packages/astro/src/`. **None of these were run in a real project.** The spikes in the PRD will confirm them.

## Requirement: the package must declare `astro` as a peer dependency
Astro passes a dependency through Vite when that dependency's package.json has `astro` in `peerDependencies` or `dependencies`, or has the `astro` keyword (`SRC/core/create-vite.ts`). Virtual modules like `astro:actions`, `astro:env/server` and `astro:content` only resolve inside the package's own code when that condition holds. This is verified in source.

## Actions: no integration API
- Astro only looks for `src/actions.ts` or `src/actions/index.ts`, and that file must export `server` (`SRC/actions/actions-file.ts`).
- **Workaround:** the Site writes `export { server } from 'astro-church/actions'`, or spreads the Theme's actions into its own `server` object. The lexer accepts re-exports, and the generated types follow them. This is inferred and needs a spike.
- Actions need an adapter or at least one route rendered on demand (`ActionsWithoutServerOutputError`).
- Dev HMR only watches `srcDir/actions/`.

## `env.schema`: yes, through `updateConfig`
- Merged key by key (`SRC/core/config/merge.ts`) and re-validated after setup.
- Code inside the package can import `astro:env/server`.
- If the Site and the integration define the same key, the two definitions are merged. Use prefixed or distinct names.
- No official examples. Verified in source.

## Fonts: yes, through `updateConfig`
- The `fonts` arrays are concatenated.
- If an entry has the same `cssVariable` as another but a different family or provider, the last one wins and a warning is printed. The integration's entries come after the Site's, so they win.
- Verified in source.
- **Verified by running it (Astro 7.3.5, 2026-11-09, spec 3.2 ticket 02):** a throwaway project whose Site config has no `fonts`, plus a local integration that calls `updateConfig({ fonts: [Poppins, Google, --font-sans, latin] })` and injects a route that renders `<Font cssVariable="--font-sans" />`.
  - `config.fonts` in `astro:config:done` holds the entry. The injected route sets `--font-sans`, with an `@font-face` and preload links. The build emits two `.woff2` files (Poppins 400 normal and italic, Astro's default when no weights are given). `astro dev` serves the font (`200 font/woff2`).
  - When the Site declares the identical entry, there's no warning: the two entries are merged and still emit two files.
  - When the Site declares a different family on `--font-sans`, Astro prints the warning, the integration's Poppins wins, and the Site's font files are emitted as well (four files).
  - `fontProviders` imported from `astro/config` worked in a module outside the Site's `src/`, and from inside the published package: `pnpm test:packed` builds the packed Starter Site with it (ticket 02).
  - Astro emits a configured font's files whether or not any page renders `<Font />`. A check that the build has font files doesn't show a page uses them; check the files a page preloads instead.

## Injected endpoints for the CMS: yes
- `injectRoute` accepts `.ts` endpoints from a package (a package export or a `URL`).
- `/cms/config/[file].yaml` with `getStaticPaths` works the same way as `[slug].json.ts`.
- **Gotcha:** an endpoint's output file has no extension added. Use an `.astro` page (or the pattern `/cms/index.html`) for the admin page. *Superseded by the R-3 spike: an `.astro` page triggers Sveltia's dev warning, so the admin page is an endpoint whose pattern switches on `command`. See `spike-r3-cms-from-package.md`, findings 2 and 4.*
- Sveltia parses config files according to the `<link type>` attribute, not the response `Content-Type`.

## Sveltia: multiple config files
- All `<link rel="cms-config-url">` files are deep-merged in order. Objects merge, and arrays such as `collections` are concatenated ([docs](https://sveltiacms.app/en/docs/config-basics#multiple-configuration-files)).
- A file containing only `backend` should work. This is inferred from the generic merge.
- `CMS.init({ config })` and `window.CMS_MANUAL_INIT` are both available.
- Custom fields registered with `CMS.registerFieldType` can be loaded from a separate script. Register them synchronously, before the config loads.
- Don't load the CDN script with `type="module"`.

## Collections re-export
- `defineCollection` is documented in `astro:content`. `astro/content/config` also exports it, but that path is undocumented, so treat it as internal.
- Astro loads `content.config.ts` with Vite's module runner (`SRC/content/utils.ts`). That means `export { collections } from 'astro-church/content'` should work. This is inferred; there is no doc or example.
- `glob({ base })` resolves against the Site root.
- Dev reloads after edits inside the package are uncertain.
