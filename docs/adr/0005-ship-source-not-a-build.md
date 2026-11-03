# The package ships its source; only the CMS browser bundle is built

The Theme's `.astro` files and CSS have to ship as source in any case, because the Site's Astro compiles them. We decided to ship the TypeScript as source too, the way Starlight does. `exports` points into `src/`, and the Site's Vite compiles the whole Theme. tsdown builds only the browser bundle for the CMS field scripts, from `client/` to `dist/client/`.

This removes a class of problems the R-1 to R-3 spikes found with a `dist` build:
- the `any` types in generated `.d.ts` files (R-1 #1)
- internal Astro paths in shipped types (R-1 #5, R-2 #7)
- the tsdown exclusion for ambient types (R-2 #4)
- the watch-mode race and the two module graphs in the dev loop (R-1 #6, R-2 #8)

Through the workspace symlink, Vite also treats the package as source, so Theme component edits hot-reload in the Starter Site.

## Considered options
- **Build to `dist`, copy `.astro`/CSS, and switch `exports` from `src` to `dist` with `publishConfig`** (R-1 #6's plan). It's what the spikes tested, but it keeps the `.d.ts` fixes and two module graphs.
- **Build everything to `dist` and develop through the watcher** (the template's setup). It's the most tested option, but it has the worst dev loop (R-4).

## Consequences
- A Site's `astro check` can type-check Theme `.ts` files under the Site's own tsconfig. The package is written against `astro/tsconfigs/strictest`, and the packed-install check runs `astro check` and a type probe on the Starter Site.
- The package's tsconfig doesn't apply inside a Site. Internal imports use package.json `imports` (`#/*`), which relies on Sites using `bundler` resolution, as Astro's tsconfig presets do.
- Shipped `src/` declares no ambient globals. A check in `pnpm verify` enforces this. Browser-only globals (Sveltia's) stay in `client/`.
- The package can only be loaded through Vite (the Astro config, dev, build, Vitest), not by plain Node. This relies on Astro running packages that depend on `astro` through Vite (`noExternal`), as Starlight does.
- There's no generated `.d.ts` surface to diff for public-contract changes (PRD §9). The three entry files are the API.
