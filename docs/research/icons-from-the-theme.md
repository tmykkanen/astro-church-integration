# Research: icons from the Theme's own dependencies (2026-11-09)

Spec 3.2 ticket 04 opened with a risk: does an icon from a Theme-owned `@iconify-json/*` set render through `astro-icon` in a pnpm install? It doesn't. This note records why, what the Theme's icons actually are, the options that were checked, and the decision.

**Decision: the Theme drops `astro-icon`. A Theme component reads `@iconify-json/simple-icons` directly, through an ordinary import, and renders the SVG at build time with `@iconify/utils`. An unknown icon name fails the build.** Lucide icons come from `@lucide/astro` (as in `sojourners.church`) and need no change.

## Why `astro-icon` can't use the Theme's icon sets

Checked in the playground (workspace install, `astro-icon` 1.2.0, `@iconify/utils` 3.1.7) and by reading the source. `<Icon>` resolves icon sets in two steps, and both start from the Site:

1. **Which sets to load:** `dist/loaders/loadIconifyCollections.js` reads `package.json` at `config.root` (the Site) and keeps its `@iconify-json/*` dependencies. The Theme's `package.json` is never read, so the build fails with `Unable to locate the "lucide" icon set!`.
2. **Where the files are:** `loadCollectionFromFS` in `@iconify/utils/lib/loader/fs.js` resolves `@iconify-json/<name>/icons.json` from `process.cwd()` (the Site). pnpm doesn't expose the Theme's dependencies there, so step 2 would fail even with step 1 fixed.

The `include` option can't help: it filters the sets step 1 found and adds none.

## What the Theme's icons are (`sojourners.church`)

- **Lucide:** 6 icons (`Settings2`, `Undo2`, `SearchIcon`, `CircleX`, `Menu`, `X`), plus `Loader` in a comment. All are imported as components from `@lucide/astro`, an ordinary import that resolves from the Theme's dependencies. `@iconify-json/lucide` is installed but unused.
- **Simple Icons:** one `<Icon>`, in `src/components/social/SocialButton.astro`: `name={`simple-icons:${social.icon}`}`. `social.icon` is free text in `site.yaml` (`socials[].icon`), and the CMS hint says "Use identifier from https://simpleicons.org/". Sojourners uses `youtube`, `facebook`, `spotify` and `whatsapp`.

So `astro-icon` serves exactly one component, and its icon name comes from content: any of the set's names must work.

## Options checked

| Option | Result |
|---|---|
| Icon sets as Site peers, keep `astro-icon` | Works, but every Site installs and lists `@iconify-json/simple-icons`. Against FR-3's "the Theme brings what its code needs". |
| Inline SVGs shipped by the Theme | Can't cover socials: any slug must work. |
| `astro-iconset` 0.0.6 | A fork of `astro-icon` with the same loader (`loadIconifyCollections.js` is line for line the same), so it fails the same way. Its `iconDirs` could point at an absolute path, but that would run 3,470 SVGs through SVGO on every start, from a one-maintainer 0.0.x package. Rejected. |
| Iconify on-demand icon components | Rendered in the browser from the Iconify API: client JS (against NFR-3), a third-party request per visitor, and no SSR. Rejected. |
| `simple-icons` npm package (16.37.0) | Works by slug (`{ title, slug, svg, path, hex }`), but not parity: 291 names that `@iconify-json/simple-icons` still has are missing, including `linkedin` and `twitter`, and 9 slugs use `_` where Iconify uses `-`. |
| **`@iconify-json/simple-icons` read directly** | **Chosen.** The same data `astro-icon` reads today, so every name that works now keeps working. Ordinary import, build-time render, no client JS, no network. |

Comparison script: compare the slugs exported by `simple-icons` with the icon and alias keys of `@iconify-json/simple-icons/icons.json` (1.2.101).

## Facts for the ticket

- `@iconify-json/simple-icons` exports `./icons.json` (4.6 MB). Importing it bundles the whole set into the server build; reading it from disk at build time (resolved from the Theme) doesn't. Either keeps client JS at zero, since the pages are prerendered (FR-4). The ticket picks one.
- `@iconify/utils` has `getIconData` (which follows aliases) and `iconToSVG` / `iconToHTML` for building the `<svg>`. `astro-icon` uses the same library, so its markup is a reference for parity.
- **An unknown name fails the build**, with a message naming the name and pointing at simpleicons.org. This matches today: `astro-icon` throws on an unknown name.
- Iconify keeps names that Simple Icons removed (that's why `linkedin` is still there). A minor bump of `@iconify-json/simple-icons` that removed a name would break a Site's content, so treat such a bump as a public-contract change (PRD §9).
