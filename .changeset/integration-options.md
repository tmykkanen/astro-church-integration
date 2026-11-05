---
"astro-church": patch
---

Adds the integration's options, validated when `astro dev` or `astro build` starts, and the `AstroChurchOptions` type:

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
