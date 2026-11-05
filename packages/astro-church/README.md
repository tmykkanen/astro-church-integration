# `astro-church`

An [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that provides a complete church-website Theme.

> Work in progress. This README becomes the Theme's documentation (PRD DX-4) as the MVP is built.

## Installation

```bash
pnpm add astro-church
```

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
