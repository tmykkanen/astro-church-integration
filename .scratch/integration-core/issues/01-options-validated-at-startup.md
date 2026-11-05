# 01: Integration options are validated when dev or build starts

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-16, FR-19 (option only), DX-2, DX-3, §9 · **ADRs:** 0002
**Blocked by:** None (can start immediately)
**Status:** resolved

## Behaviour
A Site Developer enables the Theme with `astroChurch({ cms: { repo: "owner/name" } })` and gets autocomplete and type errors for its options. A missing or malformed `cms.repo`, a `customCss` that isn't an array of strings, or a missing `site` stops `astro dev` and `astro build` with a message naming the option and the value it expects. A Site can import `AstroChurchOptions` to type its options in a separate variable.

## Acceptance criteria
- [x] Options are parsed with Zod from `astro/zod` in `astro:config:setup`.
- [x] `cms.repo` is required and must have the form `owner/name`. A missing or malformed value fails with a message naming `cms.repo` and the expected form.
- [x] `customCss` is an optional array of strings. An invalid value fails with a message naming `customCss`. The option has no behaviour yet (spec 3.6).
- [x] A missing `site` fails with a message naming `site`.
- [x] `AstroChurchOptions` is a type-only export from `astro-church`, using the schema's input type, and is the integration function's parameter type.
- [x] The Starter Site passes its `cms.repo` and still builds.

## Public contract
Adds the integration options (`cms.repo`, `customCss`) and the `AstroChurchOptions` type (PRD §9). Additive; needs a changeset.

## Seams and test list
Seam: the integration's `astro:config:setup` hook, called under Vitest with a hand-built params object. This ticket creates the seam; tickets 02–06 reuse it.
- [x] Valid options pass, with no error
- [x] Missing `cms.repo` fails, naming `cms.repo`
- [x] Malformed `cms.repo` (for example no slash) fails, naming `cms.repo` and `owner/name`
- [x] `customCss` that isn't an array of strings fails, naming `customCss`
- [x] Missing `site` fails, naming `site`
- [x] Type probe: a wrong option type in a probe config fails `astro check`, and `AstroChurchOptions` isn't `any`

Build and smoke checks: the packed-install harness's type probe covers the options; the Starter Site builds.
Manual checks: remove `cms.repo` from the Starter Site and read the `astro dev` error.

## Done when
- [x] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [x] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [x] Reviewed; findings resolved or logged here
- [x] Changeset added if the change is user-visible
- [x] PRD, ADR, GLOSSARY or README updated if anything changed (README: the options)

## Learning goal (optional)

## Comments

- **Test map (2026-11-05):** AC 1–4 → `tests/integration/options.test.ts` (one valid-options test; a ten-row `it.each`: no options, missing `cms`, missing `cms.repo`, no slash, two slashes, a space, `customCss` as a string, `customCss` with a number, an unknown top-level option, an unknown key inside `cms`; and, under `describe("Astro config")`, missing `site`). AC 2, 3 and 5 → the options probes in `tests/packed/fixtures/type-probe.ts`. AC 6 → `pnpm verify` and `pnpm test:packed`.
- **Rows added beyond the test list (2026-11-05; Tyler kept them and made the missing-`cms` row pass):** missing `cms` entirely (`{}`; Zod reports it at path `cms`, so the `cms` object carries its own message naming `cms.repo`), a second malformed `cms.repo` (two slashes), and `customCss` with a non-string entry.
- **Passed before its fix (2026-11-05):** the missing-`cms.repo` row was tightened to also require `owner/name` after Tyler had already moved the custom `error` from `.regex()` to `z.string()`. Break-it check: with the `error` on `.regex()`, a missing `repo` gave Zod's default `Invalid input: expected string, received undefined`, without `owner/name`.
- **Type probe deviates from the spec (2026-11-05):** spec 3.2's test 4 says "a wrong option type in a probe `astro.config`". The probe instead calls the integration with wrong options inside a never-run function in `type-probe.ts`, under `@ts-expect-error`. Same check, no second config for the harness to manage. Break-it check in the packed copy: with `AstroChurchOptions = any`, `astro check` failed on the `IsAny` probe and all three `@ts-expect-error` lines (TS2578). The both-ways parameter probe can't catch `any` on its own; the `IsAny` probe covers that.
- **Tightened `cms.repo` (2026-11-05):** `^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$` (GitHub owner and repo characters), which rejects spaces and newlines. The "a space" row pins it; it passed on arrival (the regex came first). Break-it check: the looser `^[^/]+\/[^/]+$` accepts `example church/grace-church`, so the row would fail against it.
- **Starter Site `site` (2026-11-05):** `http://localhost`, a placeholder. Revisit in ticket 06 (robots and sitemap use `site`) and spec 3.7 (Netlify).
- **Evidence (2026-11-05):** `pnpm verify` green (27 tests, 28 with the space row, `astro check` 0 errors, the Starter Site builds); `pnpm test:packed` green, its `astro check` reading the options probes. Tyler ran the manual `astro dev` check without `cms.repo`.
- **Review (2026-11-05):** Standards and Spec sub-agents plus the four repo axes.
  - **Fixed (test code and docs):**
    - Added a row for no options at all (`astroChurch()` passes `undefined`, not `{}`). It is red until the hook names `cms.repo` for it: `prettifyError` gives only `Invalid input: expected object, received undefined`, with no path. The earlier comment that `{}` covers this call was wrong.
    - The `site` test moved to its own `describe("Astro config")`, since `site` isn't an integration option. The options rows no longer carry `site`.
    - Probe renames: `IntegrationParam`, `astroChurchFn`. The `customCss` probe passes its options through a variable, so the `@ts-expect-error` stays on the erroring line after Biome wraps the call.
  - **Changeset bump:** `patch`, although `cms.repo` and `site` are now required. Under PRD §9 that would be breaking, which on 0.x means a minor bump. It isn't breaking yet because the package has never been published (`0.0.0`, 404 on npm), so no Site can break. Ditto for "Additive" in this ticket and the spec.
  - **Open for Tyler:**
    - Production: the no-options message; one `AstroError` form, message plus hint, for both errors; a shared `owner/name` message.
    - Decisions:
      - `z.strictObject`: unknown keys such as `customCSS` are dropped silently today.
      - Accept the probe's location and update spec test 4's wording, or add a probe `astro.config`.
    - Tyler's own test code: reuse `validOptions`/`validSite` in test 1; make `setupParams` take `site?: string`, which removes the cast in the `site` test.
  - **Nits, no change proposed:** `cms: "a/b"` reports "cms.repo is required"; when the options and `site` are both wrong, only the options error shows.
- **Review follow-up (2026-11-05):**
  - **Fixed by Tyler:**
    - Every way of missing `cms.repo` (`undefined`, `{}`, `{ cms: {} }`) now gives one shared message, `cms.repo is required, in the form owner/name`.
    - Both errors use `AstroError` with a hint.
    - The braced `if`.
    - Test 1 reuses `validOptions` and `validSite`.
  - **Decided: strict objects.** The schema and `cms` reject unknown keys (`z.strictObject`), and that is now in the spec, changeset and README. Each object's `error` is a function that returns the shared message only when its input is `undefined`, and `undefined` otherwise. A plain-string `error` would replace Zod's `Unrecognized key: "…"` message, which is how `customCSS` was first reported as "cms.repo is required". Two rows cover it. The `customCSS` row passed on arrival, because the top-level fix came first. Break-it check: under the plain-string `error`, its message didn't name `customCSS`. The `cms.repository` row was seen red.
  - **Decided: the probe stays in `type-probe.ts`.** Spec test 4's wording now says so.
  - **Not done:** `setupParams` still takes `site: string`, so the `site` test casts `undefined`.
- **Evidence (2026-11-05, after review):** `pnpm verify` passes (31 tests, `astro check` 0 errors, the Starter Site builds). `pnpm test:packed` passes, and its `astro check` reads the options probes (0 errors).
