---
"astro-church": patch
---

The Theme now adds Tailwind itself. A Site no longer installs `tailwindcss` or `@tailwindcss/vite`, and no longer adds the plugin in its `astro.config.mjs`:

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
