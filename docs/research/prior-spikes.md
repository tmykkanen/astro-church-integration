# Research: Tyler's July 2026 integration spikes

These live in `~/Repos/@tmykkanen/astro-church-integration-spikes/` (renamed 2026-10-31). Each one is a pnpm workspace containing `packages/*` and `playground/`, set up from florian-lefebvre/astro-integration-template. Nothing here was run during this review; the notes come from reading the code.

| Folder | Date | What it tries |
|---|---|---|
| `astro-church-integration-v1/` (`astro-church-theme`) | 2026-07-26 | Component overrides using a Starlight-style virtual module (`virtual:astro-church-theme/components`, which resolves to either the override path or the theme's own `.astro`). A hand-written `virtual.d.ts`. An `injectRoute` call with a package-export entrypoint. |
| `astro-church/` (`astro-church-integration`) | 2026-07-28→30 | `injectRoute` with `new URL(..., import.meta.url)` entrypoints for `/` and `/greet`. `.astro`/`.css` files copied into `dist` with tsdown `copy`. The integration sets the Fonts API (`fonts:`) through `updateConfig`. Tailwind is a peer dependency, and the Site adds the Vite plugin. The last commit message says "working setup". |
| `my-integration/` | 2026-07-27 | An unmodified copy of the template. |

## What they show
- The Starlight patterns (a virtual module for overrides, URL entrypoints) were already prototyped against Astro 6/7.
- **Shipping `.astro` files:** the current template's tsdown config only compiles `src/**/*.(ts|js)`. That leaves out `.astro`, `.tsx` and `.css`, so a theme needs either a copy step (spike 2 uses one) or to publish raw source. This is still an open technical question.
- **Setting fonts from an integration** through `updateConfig` was attempted in spike 2. Whether it works in dev and build hasn't been confirmed here.
- **Options are passed through a module-level singleton** (`setThemeOptions`) in spike 1. That's fragile: options are shared global state across config reloads. This needs revisiting.
- **The template's peer range doesn't match its playground:** the template declares peer `astro ^6.0.0` while its playground runs Astro 7.3.5. The spikes use `^6 || ^7`.
