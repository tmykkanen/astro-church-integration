# Research: original Astro Theme Provider (ATP)

Source-grounded notes from reading `astrolicious/astro-theme-provider` (last commit 2025-03-11, last release 0.7.1 on 2025-01-14) and `astro-theme-provider-template`. Collected 2026-10-30. Paths are relative to the ATP repo. "Inferred" marks behavior read from code but not documented.

## Goals (documented, `docs/.../why.mdx`)
Themes as installable integrations instead of cloned templates: installable via `astro add`, updatable via npm, usable in existing projects, multiple themes per project, configured from `astro.config`. Authors write a package that looks like an Astro project "without having to write any integration code". Starlight is named as the model.

## Shape
`defineTheme(authorOptions)` returns `(userOptions) => AstroIntegration`.

- **Author options:** `name`, `entrypoint` (inferred with `callsites`), `srcDir`, `pageDir`, `publicDir`, `middlewareDir`, `schema` (Zod), `imports`, `integrations`, `log`.
- **User options:** `config`, `pages`, `overrides`, `integrations`.

## Mechanisms
- **Imports become virtual modules** named `<theme>:<key>`.
  - Default globs (relative to srcDir) are `components/**`, `layouts/**`, `assets/**` and `styles/**`.
  - Generated modules re-export by file basename.
  - CSS files become side-effect imports.
  - Built-in modules: `<theme>:config` (the validated config as `JSON.stringify`) and `<theme>:context` (the set of integration names and the final page patterns).
- **Pages:** the `astro-pages` package globs `src/pages` and calls `injectRoute`.
  - Consumer shape: `pages: { "/404": false, "/blog": "/posts" }`.
  - Renames must keep the same dynamic params.
- **Overrides:** `overrides: { components: { Hero: "./src/Hero.astro" }, styles: ["./src/x.css"] }`.
  - Exports are replaced by name and style arrays are appended.
  - Circular overrides (an override importing the original) work through an `?importer=` virtual-id trick, which loads different content per importer.
- **Public dir:** `astro-public`, a dev middleware plus a copy step at build. User files are meant to win.
- **Middleware:** discovered by convention (`middleware.ts`, `middleware/pre`, `middleware/post`).
- **Sub-integrations:** may be conditional through a callback.
- **Hooks used:** `astro:config:setup` (everything), `astro:config:done` (`injectTypes`), `astro:db:setup`.
- **Types:**
  - The consumer `config` type is inferred from `z.input<Schema>`.
  - The keys for `pages`, `overrides` and `integrations` come from a global namespace augmentation that only exists after codegen.
  - Authors get their virtual-module types from the playground's `.astro/types.d.ts`, so a playground run is required.
- **Playground:** a pnpm workspace with `package/` (the theme) and `playground/` (an Astro site depending on the theme via `workspace:^`).
- **Packaging (template):**
  - Ships raw `.ts`/`.astro` source.
  - No `exports`, `files` or `peerDependencies`.
  - `astro` is a devDependency only; ATP is a runtime dependency.
- **Dependencies:** `astro-integration-kit`, `astro-pages`, `astro-public`, `callsites`, `fast-glob`. Peer deps: `astro >=3` and optional `@astrojs/db`.

## License
- **ATP:** The Unlicense (public domain), so code can be adapted freely.
- **Template:** says MIT in `package.json` but has no LICENSE file.
- **`astro-pages` and `astro-public`:** MIT, so keep their notice if code is copied.

## Got right
- The theme-as-integration concept with conventional Astro layout.
- Namespaced virtual modules as the seam for overrides.
- Per-export overrides that allow wrapping the original.
- Zod-validated config with good errors.
- Route disable and rename.
- A `context` module so themes can adapt to the host project.
- Package-hygiene warnings.

## Outdated or limited
- JSON-only config, so functions are lost (closed issue #176).
- Zod 3.
- The `@astrojs/db` peer dependency makes it unusable on Astro 7, where DB was removed.
- Types depend on a running playground (#120), and `declaration: true` breaks inference (#119).
- `callsites` entrypoint inference is fragile.
- Hand-rolled public-dir serving.
- No support for content collections or loaders (#8), Tailwind v4 source detection (#230), markdown config (#185), actions (#121), or the dev toolbar (#72).
- No route collision handling (#155); theme routes can outrank user routes.
- Authors can't lock pages (#107).

## Bugs observed in code
- `db/cofig.ts` typo, so the theme DB config is never loaded.
- Glob basenames are not camelCased (`my-button.astro` produces invalid JS) and silently collide across folders.
- The pattern validator rejects valid renames that add segments (#154).
- The `:config` module type uses the Zod *input* type, so defaults appear optional.
- `astro-public` dev middleware pipes the theme file even when a user file exists (missing `return`).
- Override paths are not checked for existence (inferred).

## Unclear, needs testing if relevant
- Whether `**.ext` globs recurse into subdirectories.
- How `?importer=` module duplication interacts with HMR and the build (duplicate CSS?).
- Middleware ordering across multiple themes.
