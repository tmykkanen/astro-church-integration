# 05: The Theme's env variables are declared, and an enabled Feature can require one

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-3, FR-14, §9 · **ADRs:** 0003
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
A Site's `astro.config` declares no env schema: the integration declares the Theme's four variables, with their `sojourners.church` names. All four are optional, so a Site without a calendar or subscribe form builds with none of them set. The Theme gets a `requireEnv` helper that an enabled Feature calls: when the variable is missing, it fails with a message naming the variable and the Feature. The integration also records the Theme's version in `env.schema` (R-6).

## Acceptance criteria
- [ ] `env.schema` gains `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `PUBLIC_GOOGLE_CALENDAR_ID` and `PUBLIC_GOOGLE_CALENDAR_API_KEY`, with the same context and access as `sojourners.church`, all `optional: true`.
- [ ] `env.schema` gains a field carrying the package version.
- [ ] The integration doesn't set `env.validateSecrets`.
- [ ] Theme code can import the named variables from `astro:env/*`. They type-check in the package through a dev-only declaration outside `src/`, and in the Starter Site through `astro sync`. The no-globals check still passes.
- [ ] A test fails when the dev-only declaration and the integration's `env.schema` disagree.
- [ ] `requireEnv` returns the value when it's set, and throws a message naming the variable and the Feature when it isn't.
- [ ] The Starter Site builds with none of the four variables set.
- [ ] The README lists the variables, the Feature each belongs to, and that on Netlify they must be scoped to builds as well as functions.

## Public contract
The four env var names, and their optionality, join PRD §9. Additive (the source declares the same names); needs a changeset.

## Seams and test list
Seam: the `astro:config:setup` hook (from 01), plus plain Vitest.
- [ ] The hook declares the four fields, each optional, with the source's context and access
- [ ] The hook declares the version field, set to the package version
- [ ] The hook doesn't set `validateSecrets`
- [ ] The dev-only declaration matches the schema's names and optionality
- [ ] `requireEnv` returns a set value
- [ ] `requireEnv` throws a message naming the variable and the Feature when the value is missing

Build and smoke checks: the Starter Site builds with no Theme variables set; `pnpm typecheck` passes with a named `astro:env` import in Theme source.
Manual checks: none. The end-to-end build failure is carried to spec 3.4.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed (PRD §9: env vars are optional)

## Learning goal (optional)

## Comments
