# 02: A packed install of the Theme builds

**Spec:** `.scratch/package-skeleton/spec.md` · **PRD:** §8a.3, §8a.4 · **ADRs:** 0005
**Blocked by:** 01
**Status:** resolved

## Behaviour
A script packs the package, installs the tarball into a temporary copy of the Starter Site outside the workspace, and runs `astro check`, `astro build` and smoke checks. CI runs it on every PR. This proves that a Site installing from npm, not through the workspace symlink, gets a working Theme.

## Acceptance criteria
- [x] One command runs the whole harness locally and exits non-zero on any failure.
- [x] The Starter Site copy is outside the workspace and uses the tarball, not `workspace:*`.
- [x] Smoke checks: the skeleton route's page exists, every shipped module imports (R-3 #9), and the tarball contains no test files.
- [x] A CI job runs the harness on every PR.
- [x] Risk checked: Astro compiles the package's `.ts` source from `node_modules` (`noExternal`).
- [x] Risk checked: does a Site's `astro check` typecheck the Theme's source with the Site's TypeScript? TypeScript 5.x rejects the `#/` imports (TS2307), and 6.0 accepts them (ticket 01). If 5.x fails, decide whether "TypeScript ≥ 6" goes in NFR-1 or the README. Record the result in Comments.

## Public contract
Adds a required peer, `typescript >=6` (NFR-1). Under PRD §9 this is breaking: an npm Site that pins TypeScript 5 can no longer install (`ERESOLVE`). The package is pre-release and unpublished (0.0.0), so no changeset is needed, as in ticket 01.

## Seams and test list
Seam: built Starter Site (from the packed tarball). Later specs add their own checks to this harness.
- [x] Route page exists in the build output
- [x] Every module in the tarball's `src/` imports
- [x] No test files in the tarball
- [x] Deliberately break an import, confirm the harness fails, then revert (one-time check)
Build and smoke checks: the harness itself, locally and in CI.
Manual checks: the CI run on the ticket's PR or branch.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green (before ticket 05: `pnpm lint` and the Starter Site build); the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [x] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

**2026-11-03: harness written** (`packages/astro-church/tests/packed/`, run with `pnpm test:packed`).

- **What it does:** `harness.mjs` packs the package into a fresh directory under the OS temp directory, and fails if that directory is inside the repo. It then:
  1. lists the tarball and fails on test files or test directories
  2. copies the Starter Site without `node_modules`, `dist` or `.astro`
  3. points `astro-church` at `file:<tarball>`
  4. runs `pnpm install --no-frozen-lockfile`, and fails if `node_modules/astro-church` resolves into the repo
  5. runs `astro check`, `astro build`, the route check and `import-modules.mjs`
- **On failure:** it exits 1 and keeps the temporary Site, printing its path. On success it deletes it.
- **Module-import check (R-3 #9):** bare Node can't import `.astro`, so `import-modules.mjs` runs inside the packed Site. It builds a Vite dev server from the Site's own Astro config (`getViteConfig` from `astro/config`) and loads every file in the installed package's `src/` with `ssrLoadModule`. Vite isn't a direct dependency of the Site, so the check loads the copy Astro resolves.
- **Astro dev app race:** closing the server right after the loads sometimes logged `Failed to create the dev server app: transport was disconnected`, because Astro builds its dev app in the background on server start. The check now awaits `server[Symbol.for("astro.devServerAppReady")]` (an Astro internal, the same promise Astro's dev container awaits) before closing. If Astro renames it, the race comes back as noise; the check still works.
- **pnpm version:** outside the workspace the root `packageManager` doesn't apply, and the first run used the global pnpm 11.17.0. The harness now copies the root `packageManager` into the temporary Site, so installs use 12.8.1. It also writes the workspace's `allowBuilds` into the temporary Site.
- **Fixtures (decision, Tyler):** fixtures live in `tests/`, not `src/testing/`, so nothing under `src/` is test code. `AGENTS.md` and `.claude/hooks/guard-production.mjs` were updated to match.
- **Break-it checks:**
  - Module imports: Tyler changed the route's `#/components/Skeleton.astro` import to a missing file, the harness failed, and the change was reverted.
  - Tarball check: its patterns were run against a synthetic list. They flag `src/lib/a.test.ts`, `tests/build/x.mjs` and `src/__tests__/y.ts`, and pass `src/lib/testimony.ts` and `src/pages/contest.astro`.
- **Tooling (agent):** root `pnpm test:packed`, and a separate `packed` job in `.github/workflows/ci.yml` that runs it without a workspace install. The `packed` job passed on the ticket's PR (confirmed by Tyler, 2026-11-03).

**2026-11-03: risk checks.**

- **Astro compiles the package's source from `node_modules` (`noExternal`): yes, with no Site config.** The packed Site loads `src/index.ts` from `astro.config.mjs`, compiles the injected `.astro` route and its `#/` import, and `astro build` renders the route. Astro passes the package through Vite because it peer-depends on `astro` (`docs/research/integration-capabilities.md`).
- **TypeScript 5.x in a Site: `astro check` passes, but the Theme's types silently become `any`.** Checked in a scratch copy of the packed Site with a probe `src/probe.ts` (`const notAny: number = astroChurch`), which fails only if the integration has a real type:

  | Site's TypeScript | `astro check` with the probe | `tsc --noEmit` (probe importing only) |
  | --- | --- | --- |
  | 5.9.3 | 0 errors: the probe passes, so `astroChurch` is `any` | TS2307 on `#/integration.ts` in `node_modules/astro-church/src/index.ts` |
  | 6.0.3 | 1 error, the probe's TS2322 (`() => AstroIntegration` isn't `number`), as expected | passes |

  `astro check` doesn't report diagnostics from files in `node_modules`, so under 5.x the failed `#/` import isn't reported. The integration's type falls back to `any`, which breaks DX-3 without any error. The Starter Site's `astro.config.mjs` is JavaScript, so a Site wouldn't notice until it typechecks a `.ts` file that uses the Theme's exports (`collections`, `server`, the `satisfies` type).
  - **Decision (Tyler, 2026-11-03):** "TypeScript ≥ 6" goes in NFR-1, as a requirement, because the failure is silent. It's enforced with a required peer dependency, `typescript >=6` (not optional). The PRD and the spec are updated, and Tyler adds the peer to `package.json`. Ticket 04's type probe only covers the TypeScript the Starter Site pins.

**2026-11-03: verification.**

| Acceptance criterion | Proved by |
| --- | --- |
| One command, non-zero on failure | `pnpm test:packed`; the import-break check exited 1 |
| Copy outside the workspace, uses the tarball | the harness's guards: temp directory not inside the repo; `node_modules/astro-church` doesn't resolve into the repo |
| Smoke checks | the three PASS lines; break-it checks above |
| CI job on every PR | `packed` job in `ci.yml` (`pull_request` trigger), passed on the ticket's PR |
| Risk: `noExternal` | packed `astro build` (risk checks above) |
| Risk: TypeScript 5.x | probe table above; decision in NFR-1 and the spec |

- **No changeset:** the package is pre-release (0.0.0), as in ticket 01.

**2026-11-03: review** (`review:` against `main`, commit f0a27ab).

- **Resolved (agent, harness fixes):**
  - The harness copied the Starter Site's gitignored `.env` into the temporary Site and kept it after a failure. It now skips `.env*`.
  - `allowBuilds` was hand-written and had already drifted (no `lefthook`). It's now copied from the root `pnpm-workspace.yaml`.
  - Path handling: `isInside` uses `isAbsolute` and `..${sep}`, and the copy filter splits on `sep`.
  - `run()` reports a command that can't start. `fail()` prints the temporary directory, which exists even if packing fails.
  - Names clarified (`tempDir`, `testsDir`, `tarEntries`, `excludedDirs`, `rootManifest`).
  - `import-modules.mjs` loads code modules only (`.astro`, `.js`/`.ts` variants, not `.d.ts`), so ticket 03's CSS doesn't trip it.
- **Resolved (agent, docs):**
  - The spec said a required peer makes a 5.x Site "warn". npm 7+ refuses the install (`ERESOLVE`, checked in a scratch Site) and only pnpm warns. The spec bullet is corrected.
  - "Public contract: None" was stale. It now records the peer as breaking under §9 and why there's no changeset.
- **Logged, not changed:**
  - Duplicated route constants, page check and `fail()` with `tests/build/skeleton-route.mjs`. Extract when ticket 03 adds a third copy. `skeleton-route.mjs` has the same `run`/`fail` weaknesses.
  - The harness's `astro check` step isn't evidence for the Theme's types (it hides `node_modules` diagnostics). Ticket 04's type probe covers that.
  - The tarball patterns were tested on a synthetic list, not a real leaked file.
- **Deviation (Tyler accepted, 2026-11-03):** `docs/workflow.md` says Tyler writes the first smoke check. The agent drafted these smoke checks in `test:` mode without flagging the rule. Tyler reviewed them, ran the import-break check, and chose to log the deviation rather than rewrite a check by hand.

## Retro
Learned: · Surprised by: · Next time:
