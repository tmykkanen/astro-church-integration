# 02: The Theme's font loads without Site configuration

**Spec:** `.scratch/integration-core/spec.md` · **PRD:** FR-3 · **ADRs:** 0002
**Blocked by:** 01
**Status:** ready-for-human

## Behaviour
A visitor sees the Theme's font (Poppins) on Theme pages, though the Site's `astro.config` declares no fonts. The integration adds the font through Astro's fonts API, and the skeleton route renders it until the layout takes over in spec 3.4.

## Acceptance criteria
- [ ] **Risk, checked first:** an integration can add `fonts` through `updateConfig` in `astro:config:setup`. If it can't, stop and record the finding and the alternative here and in the spec before going on.
- [ ] The integration adds Poppins (Google provider, `--font-sans`, latin subset), with no option to change it.
- [ ] The skeleton route renders the font.
- [ ] The packed install's skeleton route sets `--font-sans`, and the build emits the font files.

## Public contract
None. The font isn't configurable.

## Seams and test list
Seam: the `astro:config:setup` hook (from 01), plus the packed-install harness.
- [ ] The hook's `updateConfig` receives the Poppins `fonts` entry
- [ ] Harness: the skeleton route's CSS sets `--font-sans`
- [ ] Harness: the font files are in the build output

Build and smoke checks: the two harness checks above.
Manual checks: the skeleton route shows Poppins in `astro dev`.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed (research note: mark the `fonts` question verified)

## Learning goal (optional)

## Comments
