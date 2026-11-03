# 01: The Starter Site renders a route served from the Theme's source

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** FR-1, FR-2 (one route), NFR-1, DX-3 · **ADRs:** 0002, 0005
**Blocked by:** None
**Status:** ready-for-human

## Behaviour
The package ships its source (ADR-0005). The integration injects one `.astro` route that renders a Theme component and uses a `#/` import, and the Starter Site serves it in `astro dev` and `astro build`. This is the tracer bullet the rest of the spec builds on.

## Acceptance criteria
- [ ] `exports` has `.` pointing into `src`. tsdown no longer builds the Node code.
- [ ] `imports` maps `#/*` to `./src/*`, `#/` imports name the file exactly (`#/integration.ts`; a folder as `…/index.ts`), and the package tsconfig uses `bundler` resolution.
- [ ] `"sideEffects": false` is gone, and the peer is `astro ^7.3.0`.
- [ ] The route entrypoint comes from `new URL(…, import.meta.url)` and isn't in `exports`.
- [ ] The route renders in the Starter Site's dev server and build, and `astro check` passes.
- [x] Risk checked: a `#/` import, both extensionless and a folder import, resolves in Vite and in `tsc`. If either fails, record the fallback to explicit `.ts` in Comments and in the spec. (`tsc` fails, so the fallback applies. See Comments.)

## Public contract
Changes the `astro-church` entry point to source and sets the peer range (NFR-1). Pre-release, so no changeset needed.

## Seams and test list
Seam: built Starter Site (in the workspace).
- [ ] The Starter Site builds, and the output contains the route's page with the component's markup
- [ ] `tsc --noEmit` passes for the package
Build and smoke checks: `astro check` and `astro build` in the Starter Site.
Manual checks: the route in `astro dev`; edit the Theme component and note whether it hot-reloads (input for ticket 08).

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green (before ticket 05: `pnpm lint` and the package build); the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

**2026-11-03: `#/` resolution risk check.** Ran in a scratch workspace outside the repo, against Astro 7.3.5, TypeScript 6.0.3 and Node 24. The setup was a source-shipped package with `"#/*": "./src/*"` and `bundler` resolution, and a Site that used its integration. An injected route (entrypoint from `new URL(…, import.meta.url)`) rendered a Theme component that used `#/` imports.

| Import | Vite (`astro build`) | `tsc --noEmit` |
|---|---|---|
| `#/greet` (extensionless file) | resolves | TS2307 |
| `#/util` (folder with `index.ts`) | resolves | TS2307 |
| `#/greet.ts`, `#/util/index.ts` | resolves | resolves |

- **The prefix isn't the cause.** `#src/*` failed the same way. `tsc` doesn't add extensions or `index` files to an `imports` target, even with `bundler` resolution.
- **Considered:** a fallback array (`["./src/*", "./src/*.ts", "./src/*/index.ts"]`). It passed `tsc`, `astro build` and `astro check`, but bare Node still failed (`ERR_MODULE_NOT_FOUND`), because only Vite resolves the paths.
- **Decision (Tyler):** explicit extensions, the ticket's fallback. With the single map and exact paths, `tsc`, `astro build` and the Site's `astro check` passed, and the package imported in bare Node from the workspace.
- **Ported tests:** they import through extensionless or folder `#/` paths (for example `'#/lib/scriptureParsing/'`). Tyler approved one blanket change: add the exact file to those paths, and leave assertions unchanged.
- **Recorded in:** the spec's **Internal alias** decision.

## Retro
Learned: · Surprised by: · Next time:
