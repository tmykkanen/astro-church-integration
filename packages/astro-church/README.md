# `astro-church`

An [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that provides a complete church-website Theme.

> Work in progress. This README becomes the Theme's documentation (PRD DX-4) as the MVP is built.

## Installation

```bash
pnpm add astro-church
```

## Configuration

Add the integration to your Site's `astro.config.mjs`, and set `site`:

```js
import { defineConfig } from "astro/config";
import astroChurch from "astro-church";

export default defineConfig({
	site: "https://example.church",
	integrations: [astroChurch({ cms: { repo: "owner/name" } })],
});
```

`site` is required: the Theme stops dev and build without it.

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `cms.repo` | `string` | Yes | The GitHub repository the CMS edits, in the form `owner/name` (for example `example/grace-church`). |
| `customCss` | `string[]` | No | Reserved for your own stylesheets. It has no effect yet. |

The options are checked when `astro dev` or `astro build` starts. A missing or invalid option stops it with an error that names the option and the value it expects. Unknown options are rejected too, so a misspelling such as `customCSS` fails instead of being ignored.

To build the options in a separate variable or file, type them with `AstroChurchOptions`:

```ts
import type { AstroChurchOptions } from "astro-church";

const options: AstroChurchOptions = { cms: { repo: "owner/name" } };
```

## Styling

The Theme brings Tailwind. Your Site doesn't install `tailwindcss` or add the `@tailwindcss/vite` plugin. If your Site already adds the plugin, the Theme detects it and doesn't add a second copy.

Only the Theme's stylesheet imports Tailwind, so each page loads Tailwind's base styles once. Your Site's own stylesheets must never import Tailwind (no `@import "tailwindcss"`), or each page loads those base styles twice. Support for Site stylesheets, including how one uses `@reference` to reach Tailwind's utilities and the Theme's theme without adding CSS, comes in a later release.

## Contributing

This package lives in a monorepo:

- `packages/astro-church/` contains the package
- `playground/` contains the Starter Site, used to develop and test it

Install dependencies:

```bash
pnpm i --frozen-lockfile
```

Start the Starter Site and the bundle watcher:

```bash
pnpm dev
```

This builds the CMS field bundle once, then runs the bundle watcher and the Starter Site's `astro dev` side by side.

### What reaches a running `pnpm dev`

The Starter Site reads the package's source directly. Even so, some edits don't reach a running dev server. This table shows what to expect after each kind of edit:

| Edit | Reaches the running Starter Site? | To see it |
| --- | --- | --- |
| A Theme component (`src/**/*.astro`) | Yes | Nothing to do: the page reloads on save |
| Theme CSS (`src/styles/`) | Yes | Nothing to do: the page reloads on save |
| The integration (`src/integration.ts`) | No | Restart `pnpm dev`. Saving the Site's `astro.config.mjs` isn't enough |
| Collections (`src/content.ts`) | No | Stop `pnpm dev`, run `pnpm --filter playground exec astro sync`, then start `pnpm dev` again. Running `astro sync` alongside the dev server isn't enough. If content no longer matches the schema, `astro sync` fails with the validation error, and editor types stay stale until it passes |
| Actions (`src/actions.ts`) | No | Save the Site's `src/actions/index.ts` (see the next row), or restart `pnpm dev` |
| Saving the Site's `src/actions/index.ts` after a Theme action edit | Yes | Nothing more to do: the Theme action edit takes effect |
| The CMS field bundle (`client/`, rebuilt by the watcher) | Yes | No restart: save the file and the watcher rebuilds the bundle. An `.astro` page that imports it reloads by itself; the CMS admin page is an endpoint, so reload it in the browser |

## Licensing

[MIT Licensed](https://github.com/tmykkanen/astro-church-integration/blob/main/LICENSE). Made by [Tyler Mykkanen](https://github.com/tmykkanen).

## Acknowledgements

- Created using [astro-integration-template](https://github.com/florian-lefebvre/astro-integration-template).
