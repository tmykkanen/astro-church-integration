# 01: Integration options are validated when dev or build starts

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-16, FR-19 (option only), DX-2, DX-3, §9 · **ADRs:** 0002
**Blocked by:** None (can start immediately)
**Status:** ready-for-human

## Behaviour
A Site Developer enables the Theme with `astroChurch({ cms: { repo: "owner/name" } })` and gets autocomplete and type errors for its options. A missing or malformed `cms.repo`, a `customCss` that isn't an array of strings, or a missing `site` stops `astro dev` and `astro build` with a message naming the option and the value it expects. A Site can import `AstroChurchOptions` to type its options in a separate variable.

## Acceptance criteria
- [ ] Options are parsed with Zod from `astro/zod` in `astro:config:setup`.
- [ ] `cms.repo` is required and must have the form `owner/name`. A missing or malformed value fails with a message naming `cms.repo` and the expected form.
- [ ] `customCss` is an optional array of strings. An invalid value fails with a message naming `customCss`. The option has no behaviour yet (spec 3.6).
- [ ] A missing `site` fails with a message naming `site`.
- [ ] `AstroChurchOptions` is a type-only export from `astro-church`, using the schema's input type, and is the integration function's parameter type.
- [ ] The Starter Site passes its `cms.repo` and still builds.

## Public contract
Adds the integration options (`cms.repo`, `customCss`) and the `AstroChurchOptions` type (PRD §9). Additive; needs a changeset.

## Seams and test list
Seam: the integration's `astro:config:setup` hook, called under Vitest with a hand-built params object. This ticket creates the seam; tickets 02–06 reuse it.
- [ ] Valid options pass, with no error
- [ ] Missing `cms.repo` fails, naming `cms.repo`
- [ ] Malformed `cms.repo` (for example no slash) fails, naming `cms.repo` and `owner/name`
- [ ] `customCss` that isn't an array of strings fails, naming `customCss`
- [ ] Missing `site` fails, naming `site`
- [ ] Type probe: a wrong option type in a probe config fails `astro check`, and `AstroChurchOptions` isn't `any`

Build and smoke checks: the packed-install harness's type probe covers the options; the Starter Site builds.
Manual checks: remove `cms.repo` from the Starter Site and read the `astro dev` error.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed (README: the options)

## Learning goal (optional)

## Comments
