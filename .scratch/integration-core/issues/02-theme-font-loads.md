# 02: The Theme's font loads without Site configuration

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-3 · **ADRs:** 0002
**Blocked by:** 01
**Status:** resolved

## Behaviour
A visitor sees the Theme's font (Poppins) on Theme pages, though the Site's `astro.config` declares no fonts. The integration adds the font through Astro's fonts API, and the skeleton route renders it until the layout takes over in spec 3.4.

## Acceptance criteria
- [x] **Risk, checked first:** an integration can add `fonts` through `updateConfig` in `astro:config:setup`. If it can't, stop and record the finding and the alternative here and in the spec before going on.
- [x] The integration adds Poppins (Google provider, `--font-sans`, latin subset), with no option to change it.
- [x] The skeleton route renders the font.
- [x] The packed install's skeleton route sets `--font-sans`, and the build emits the font files the route preloads.

## Public contract
None. The font isn't configurable.

## Seams and test list
Seam: the `astro:config:setup` hook (from 01), plus the packed-install harness.
- [x] The hook's `updateConfig` receives the Poppins `fonts` entry
- [x] Harness: the skeleton route's CSS sets `--font-sans` to Poppins
- [x] Harness: the font files the skeleton route preloads are in the build output (changed from "the font files are in the build output"; see Comments)

Build and smoke checks: the two harness checks above.
Manual checks: the skeleton route shows Poppins in `astro dev`.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible (not needed: the font isn't public contract, and spec 3.2 lists changesets only for tickets 01, 03, 04 and 05)
- [x] PRD, ADR, GLOSSARY or README updated if anything changed (research note: mark the `fonts` question verified)

## Learning goal (optional)

## Comments

- **Risk check passed (2026-11-09):** on Astro 7.3.5, an integration can add `fonts` through `updateConfig` in `astro:config:setup`. It was run in a throwaway project outside the repo: a Site config with no `fonts`, and a local integration that adds Poppins and injects a route rendering `<Font cssVariable="--font-sans" />`. The route sets `--font-sans`, the build emits two `.woff2` files, and `astro dev` serves them. Details are in `docs/research/integration-capabilities.md` (Fonts).
  - **For the README (optional):** a Site that sets its own font on `--font-sans` gets a warning from Astro and Poppins still wins, but its own font files are emitted too.
  - **Answered since:** `fontProviders` from `astro/config` resolves inside the published package; `pnpm test:packed` builds the packed Starter Site with it.
- **Harness check changed (2026-11-09):** the test list's "the font files are in the build output" passes before the route renders anything, because Astro emits a configured font's files whether or not a page renders `<Font />`. The check is now "the font files the skeleton route preloads are in the build output": it reads the route's `<link rel="preload" as="font">` tags and fails if there are none or any file is missing. It needs `<Font … preload />`, which matches `sojourners.church`'s `Base.astro`. It checks for at least one file, not two: the count is Astro's default weights (400 normal and italic), not this ticket's behaviour. Its logic was exercised against the risk-check project (passes with `preload`, fails without it, and fails with a deleted file), since the harness stops at the `--font-sans` check before reaching it.
- **Test map (2026-11-09):** AC 1 → the risk check above. AC 2 → `tests/integration/fonts.test.ts` ("the integration adds the Theme's font (Poppins, Google, --font-sans, latin)"); "no option to change it" holds because the options schema has no font option (spec 3.2 lists one as out of scope), so no test. AC 3 → the manual `astro dev` check, plus the harness's `--font-sans` and preload checks. AC 4 → the two harness checks in `tests/packed/harness.mjs`.
- **Red first (2026-11-09):** the hook test failed with no `updateConfig` call; the `--font-sans` check failed until the route rendered `<Font />`. The `--font-sans` check needs Poppins in the value: the route's CSS already declared `--font-sans` with Tailwind's system font stack.
- **Cascade (2026-11-09):** the route's CSS has two `--font-sans` declarations. Astro's (Poppins) is in an inline `<style>` with no cascade layer; Tailwind's is inside `@layer theme`. A declaration outside any layer beats a layered one whatever the order, so Poppins wins, and Tailwind's preflight reads it through `--default-font-family: var(--font-sans)`. The harness reads CSS text only; the manual check confirms what the browser shows.
- **Review (2026-11-09):** Standards and Spec sub-agents plus the four repo axes. No hard violations, no spec defects, no public-contract change; footprint matches `sojourners.church` (an inline `@font-face` style and two preload links, no client JS; NFR-3).
  - **Fixed (test code):** `setupParams` and `runSetup` moved into `tests/integration/setup.ts`, shared by `options.test.ts` and `fonts.test.ts` (Tyler approved changing `options.test.ts`, first to add `updateConfig: vi.fn()` to its helper); the harness header lists the font checks; `FONT_VARIABLE` and `FONT_FAMILY` constants; tags read `(ticket 02, spec 3.2)`, and the header says untagged ticket numbers are spec 3.1's; the test is named in glossary terms.
  - **Fixed (docs):** the changed harness check is recorded here and in spec 3.2's Testing Decisions; the "expect two font files" note is gone; the `fontProviders` question is answered here and in the research note.
  - **Open for Tyler:**
    - The skeleton route has `<head>` but no `<body>`. Browsers add one; the route goes away in spec 3.4.
    - `tests/` isn't typechecked: the package `typecheck` includes only `src/`. A one-off check of `tests/integration` with a temporary tsconfig passed.
  - **Not changed:** `--font-sans` is written in four places (`integration.ts`, the route, the harness, the test). `<Font>` needs the literal; revisit when spec 3.4 moves it into the layout.
- **Evidence (2026-11-09):** `pnpm verify` passes (32 tests, `astro check` 0 errors, the Starter Site builds). `pnpm test:packed` passes, including both font checks. After the review fixes: the integration tests pass (13), `typecheck` 0 errors, `pnpm test:packed` passes. Tyler ran the manual check: `/theme-skeleton` shows Poppins in `astro dev`.
