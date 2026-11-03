// Check-only Astro root for the Theme's `.astro` files (ticket 05). Run by the
// package's `typecheck` script: `astro check --root tests/astro-check`.
//
// Why not `--root .`: Astro would read `src/actions.ts` as the project's own
// actions file and, with no adapter, throw `ActionsWithoutServerOutputError`
// before checking anything. Pointing `srcDir` at a folder that doesn't exist
// gives Astro nothing to pick up. `astro check` reads the files this root's
// `tsconfig.json` includes, not `srcDir`, so the Theme's source is still
// checked. The "Missing pages directory" warning is expected.

export default { srcDir: "./no-src" };
