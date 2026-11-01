# Features are enabled by the Site Editor through content, not by integration options

The Site Editor turns Features on and off, and chooses their URL slugs, from the CMS (navigation entries and settings flags). Integration options don't control them. The integration therefore always injects every Feature's routes. Each route's `getStaticPaths` returns no pages when its Feature is not enabled in content.

Integration options are reserved for what content cannot express: secrets and environment setup, integrations specific to one Site, and code-level customization.

We chose this to keep the Theme's low-code promise: a church can add a calendar without a developer. It also matches how `sojourners.church` already works.

## Considered options
- **Integration options (`features: { calendar: true }`)**: typed, and only the routes needed would be injected. Rejected because every Feature change would need a developer.
- **Developer chooses what is available, editor chooses what is shown**: deferred. We'll add it if a Site needs to guarantee that a Feature's endpoints never exist.

## Consequences
- Anything a Feature needs when the integration is set up must be safe to have present even while the Feature is disabled. Examples are an Action, an env var schema, and route entrypoints.
- Setup-time checks that depend on which Features are enabled must read content files directly, because the content layer has not loaded at that point.
