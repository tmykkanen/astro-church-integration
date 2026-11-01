# The Theme exports its complete content collections; the Site re-exports them

Astro gives integrations no way to add content collections, so `src/content.config.ts` has to live in the Site. Rather than having each Site wire up the collections from schemas the Theme exports (Starlight's pattern), the Theme exports a finished `collections` object: names, loaders, content paths and schemas. The Site's file is then a single re-export:

```ts
export { collections } from 'astro-church/content';
```

We chose this because collection names and content paths are already fixed by the Theme's pages and its Sveltia config. That makes per-Site wiring mostly a chance to break things. It would also turn every new Feature collection into a breaking change that each Site has to make by hand.

A Site can still extend the Theme by spreading its collections and overriding individual keys. That covers adding its own collections, replacing one, or swapping a loader. To extend a schema, the Site uses the schema the Theme exports alongside `collections`. A finished collection's `schema` is typed as optional and possibly a function, so it can't be extended directly.

## Consequences
- Adding a collection is a non-breaking Theme release. Renaming or moving one is breaking.
- Each collection's schema is exported and part of the public contract (PRD §9).
- Verified by the R-1 spike (2026-11-01, `docs/research/spike-r1-collections-reexport.md`): the re-export works in dev and build and with types, and so do spreading and overriding. It has three conditions:
  - The package's declaration build has to see ambient Astro types (`types: ["astro/client"]`), or the Site's types are all `any`.
  - Astro decides whether to revalidate cached content from the text of the Site's `content.config.ts`, which never changes. The integration therefore puts the Theme's version into the Astro config (an `env.schema` entry), so a Theme upgrade clears the content cache (PRD R-6).
  - Collection `base` paths resolve against the Site's project root, not `srcDir`. The spec decides whether custom `srcDir` is supported.
