# Convert astro-church into a hand-written integration instead of rebuilding Astro Theme Provider

The goal is no longer a general theme framework. We will turn `astro-church` into an installable, updatable Astro integration, written directly against Astro's integration API the way Starlight is. Our research found that most of what Astro Theme Provider did is now built into Astro (`injectRoute` with package entrypoints, `injectTypes`, `addMiddleware`). It also found that astro-church's hard problems are specific to the theme: content collections, CMS-edited settings, the React/Tailwind/adapter dependencies. Designing a framework from a single example would mean guessing at the abstractions. Parts that look generic (route injection, the config module, type generation, overrides) will sit behind clear internal module boundaries, so a framework can be extracted later if a second theme shows they really repeat. Extracting one is a possible future step, not a goal.

## Consequences
- Supersedes ADR-0001. Its scope limits (one theme per Site, full-site only) still hold, now simply because there is one theme.
- The Astro Theme Provider research stays as prior art. Its code is not a starting point.
