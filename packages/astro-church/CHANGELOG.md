# astro-church

## 0.0.1

### Patch Changes

- [`d1caf84`](https://github.com/tmykkanen/astro-church-integration/commit/d1caf849e8a53207d5716fc1dfeb1a2be2c22906) Thanks [@tmykkanen](https://github.com/tmykkanen)! - Adds the `astro-church/content` and `astro-church/actions` entry points. A Site re-exports the Theme's `collections` and Actions `server` from them, and checks its `server` against the new `ThemeActions` type:
  
  ```ts
  // src/content.config.ts
  export { collections } from "astro-church/content";
  ```
  
  ```ts
  // src/actions/index.ts
  import { server as astroChurchServer, type ThemeActions } from "astro-church/actions";
  
  export const server = { ...astroChurchServer } satisfies ThemeActions;
  ```
  
  A Site may add its own actions inside the braces. `ThemeActions` requires the Theme's actions, with the names and result shapes the Theme's forms expect, and allows any others. Both entry points are empty for now; collections and actions arrive with their Features.
  
  As before, a Site needs an adapter: Astro requires one once an actions file exists, even an empty one.

- [`75826f7`](https://github.com/tmykkanen/astro-church-integration/commit/75826f7e7698e93d5891d0b309f150c5989a0ed5) Thanks [@tmykkanen](https://github.com/tmykkanen)! - Adds the integration's options, validated when `astro dev` or `astro build` starts, and the `AstroChurchOptions` type:
  
  ```js
  // astro.config.mjs
  import { defineConfig } from "astro/config";
  import astroChurch from "astro-church";
  
  export default defineConfig({
  	site: "https://example.church",
  	integrations: [astroChurch({ cms: { repo: "owner/name" } })],
  });
  ```
  
  - `cms.repo` (required): the GitHub repository the CMS edits, in the form `owner/name`.
  - `customCss` (optional): an array of strings. It has no effect yet.
  
  A Site must now set `site` in its Astro config. A missing or invalid option, an unknown option (such as a misspelt `customCSS`), or a missing `site` stops dev and build with an error naming it. To build the options in a separate variable, type them with `AstroChurchOptions`:
  
  ```ts
  import type { AstroChurchOptions } from "astro-church";
  ```

- [`20f3967`](https://github.com/tmykkanen/astro-church-integration/commit/20f39676b36f5e05bdacb71cb03be0adfdade0d2) Thanks [@tmykkanen](https://github.com/tmykkanen)! - The Theme now adds Tailwind itself. A Site no longer installs `tailwindcss` or `@tailwindcss/vite`, and no longer adds the plugin in its `astro.config.mjs`:
  
  ```js
  // astro.config.mjs: the Tailwind lines can go
  import { defineConfig } from "astro/config";
  import astroChurch from "astro-church";
  
  export default defineConfig({
  	site: "https://example.church",
  	integrations: [astroChurch({ cms: { repo: "owner/name" } })],
  });
  ```
  
  A Site that keeps its own `@tailwindcss/vite` plugin still works: the Theme finds it and doesn't add a second one.
  
  Only the Theme's stylesheet imports Tailwind, so each page loads Tailwind's base styles once. A Site stylesheet must never import Tailwind (no `@import "tailwindcss"`), or each page loads those base styles twice.
