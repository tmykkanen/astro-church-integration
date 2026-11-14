---
"astro-church": patch
---

The Theme now adds `@astrojs/sitemap` itself, so a Site's build writes `sitemap-index.xml` under its `site` URL. A Site no longer installs `@astrojs/sitemap` or adds it to `integrations`.

A Site that keeps its own `@astrojs/sitemap`, for example to pass its own options, still works: the Theme finds it and uses the Site's copy instead of adding a second one.

The Theme draws its icons from its own dependencies, so a Site doesn't need `astro-icon` or any `@iconify-json/*` icon set for the Theme.
