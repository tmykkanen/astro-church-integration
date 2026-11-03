---
"astro-church": patch
---

Adds the `astro-church/content` and `astro-church/actions` entry points. A Site re-exports the Theme's `collections` and Actions `server` from them, and checks its `server` against the new `ThemeActions` type:

```ts
// src/content.config.ts
export { collections } from "astro-church/content";
```

```ts
// src/actions/index.ts
import { server as astroChurchServer, type ThemeActions } from "astro-church/actions";

export const server = { ...astroChurchServer } satisfies ThemeActions;
```

A Site may add its own actions inside the braces. `ThemeActions` requires the Theme's actions, with the names and result shapes the Theme's forms expect, and allows any others. Both entry points are empty for now; collections and actions arrive with their Features.

As before, a Site needs an adapter: Astro requires one once an actions file exists, even an empty one.
