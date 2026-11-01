# The Theme exports its complete content collections; the Site re-exports them

Astro gives integrations no way to add content collections, so `src/content.config.ts` has to live in the Site. Rather than having each Site wire up the collections from schemas the Theme exports (Starlight's pattern), the Theme exports a finished `collections` object: names, loaders, content paths and schemas. The Site's file is then a single re-export:

```ts
export { collections } from 'astro-church/content';
```

We chose this because collection names and content paths are already fixed by the Theme's pages and its Sveltia config. That makes per-Site wiring mostly a chance to break things. It would also turn every new Feature collection into a breaking change that each Site has to make by hand.

A Site can still extend the Theme by spreading its collections and overriding individual keys. That covers adding its own collections, extending a schema, or swapping a loader.

## Consequences
- Adding a collection is a non-breaking Theme release. Renaming or moving one is breaking.
- Unverified: whether collection definitions built inside a package work when a Site re-exports them. A spike must confirm this before the spec is written.
