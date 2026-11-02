# Research: R-2 spike, Actions re-export (Astro 7.3.5, @astrojs/node 11.1.9, tsdown 0.23.0, 2026-11-02)

PRD risk R-2 and ADR-0004 ask whether a Site can re-export a complete `server` object defined in the package, with types, and whether the subscribe form still works. Tyler built the spike on branch `spike/actions-reexport` with a stub action, not the real subscribe handler.

**Verdict: R-2 passes, and ADR-0004 stands, with conditions.** The one-line re-export works in `astro sync`, `check`, `build` and at runtime, and the Site's types follow it. Theme client code can call Theme actions with full types. The conditions are five findings the spec has to carry:
1. Inside the package, `actions` from `astro:actions` is untyped. A type-only cast fixes it.
2. Nothing checks that a Site's `server` still contains the Theme actions its client code calls. Overriding or removing one breaks the Theme's form silently.
3. Inside the package, `astro:env/server` doesn't export the Theme's variables. A local ambient declaration fixes it, but it has to be pulled in explicitly or the shipped types get `any`.
4. A missing secret isn't caught at deploy time. The first action call fails, and the Theme's form shows nothing.
5. Package action edits don't reach a running dev server (R-4).

**Not done:** an `astro build` with `@astrojs/netlify`, and a deliberate R-4 pass. See [Still open](#still-open).

## Setup
- `packages/astro-church/src/actions.ts` exports `server = { test: defineAction({ accept: "form", input: z.object({ name: z.string() }), handler }) }`. The handler returns `{ ok: true, message, length }`, where `length` is the length of a secret read from `astro:env/server`.
- `src/test-form.ts` exports `init()`, a copy of `sojourners.church`'s `components/subscribe/init.ts` pointed at `actions.test`.
- `src/integration.ts` declares `ASTRO_CHURCH_TEST_SECRET` (`context: "server"`, `access: "secret"`) through `updateConfig({ env: { schema } })` in `astro:config:setup`.
- The package exports `./actions` and `./test-form` with the same `{ types, default }` shape as `.`. No tsdown change was needed for new entries: `src/**/*.(ts|js)` with `unbundle: true` already builds every file.
- The playground uses `@astrojs/node` (`mode: "standalone"`), so the built server can be run and called locally. Its `src/actions/index.ts` started as `export { server } from "astro-church/actions";` and then went through the spread variations below. Its index page has the form markup, and its script is `import { init } from "astro-church/test-form"; init();`.
- **Runtime checks:** `POST /_actions/<name>` with `curl -F` against `astro dev` and against the built `dist/server/entry.mjs`.
- **Type probes:** a temporary file in `src/` (Site or package) with `@ts-expect-error` lines and a deliberate control error, type-checked with the workspace `tsc` and deleted afterwards.

## Results

| Check | Result |
|---|---|
| Re-export: `astro sync`, `check`, `build` (from a clean `.astro/`) | ✅ 0 errors. `.astro/actions.d.ts` declares `actions` as `typeof import(".../src/actions/index.ts")["server"]`. |
| Site types | ✅ `data` is the handler's return type. A wrong type or an unknown action errors. |
| Runtime (dev and built server) | ✅ Valid input returns the handler's result. A missing field returns `AstroActionInputError` with `fields.name`. |
| Theme client code calling a Theme action | ✅ At runtime. ❌ Untyped until fixed (finding 1). |
| Spread: add a Site action | ✅ Runtime and types |
| Spread: override with a compatible shape | ✅ The Site's handler runs, and the Theme's form shows its result |
| Spread: override with an incompatible shape, or remove | ⚠️ Works, and nothing catches the break (finding 2) |
| `astro:env/server` in the package's action | ✅ At runtime and in the Site's types. ❌ In the package's types until fixed (finding 3). |
| Secret in `dist/client` or `dist/server` | ✅ Not found. Handler code isn't in `dist/client` either. |
| Missing secret | ⚠️ Fails on the first action call, not at deploy (finding 4) |
| Package action edits during `astro dev` (R-4) | ❌ Need a restart (finding 5) |

### An empty form field arrives as `null`
Astro passes an empty form field to the action as `null`, not `""`, so `z.string()` rejects it with `expected string, received null`, the same as a missing field. That's why `sojourners.church`'s `SubscribeSchema` wraps each field in `z.preprocess((v) => (v === null ? "" : v), …)`: `.min(2, …)` can then return its own message. Keep it when the real schema moves.

## Finding 1: `actions` is untyped inside the package

**Symptom:** in `src/test-form.ts`, `actions.test`, its awaited result and `result.data` are all `any`. Destructuring `{ ok, message, error }` from a `{ greeting }` result type-checked. `isInputError` still narrows `result.error`, which makes the file look typed.

**Cause:** without a Site, `astro:actions` declares `actions: Record<string | symbol, any>` (`dist/actions/runtime/entrypoints/server.d.ts`). The Site narrows it through its generated `.astro/actions.d.ts`, which the package never sees.

**The fix (applied on the spike branch):** cast to the type of the package's own `server`, with a type-only import:

```ts
import { isInputError, actions as untypedActions } from "astro:actions";
import type { server } from "./actions.ts";

const actions = untypedActions as typeof server;
```

- `verbatimModuleSyntax` (on through `astro/tsconfigs/strictest`) guarantees the `import type` is removed. `dist/test-form.js` imports only `astro:actions`, and no handler or schema code reaches the client bundle (NFR-3).
- The cast doesn't leak: `dist/test-form.d.ts` is `init: () => void`.
- Verified by probe: `data.message` is `string`, using it as a number errors, `actions.nope` errors, and the `{ ok, message, error }` destructure now fails as it should.

A `declare module "astro:actions"` in the package was considered and not used: it would apply to every file in the package and could clash with the Site's generated declaration if it shipped.

**The package had no type check:** `tsc --noEmit` also found `'errors' is of type 'unknown'` in `test-form.ts` (from `Object.entries(fields)`). tsdown's declaration build doesn't report errors in function bodies, so nothing had caught it.

## Finding 2: the Theme's client code trusts the Site's `server`

The cast in finding 1 is checked against the package's own `server` when the package builds. When the Site builds, `astro check` sees `init()` as `() => void` and never compares the Site's actions with what the Theme's client code expects.

| Site's `server` | `astro check` | The Theme's form |
|---|---|---|
| `{ ...themeServer, helloSite }` | ✅ | ✅ |
| `test` overridden, returns `{ ok, message, extra }` | ✅ | ✅ Shows the Site's message |
| `test` overridden, returns `{ hello }` | ✅ 0 errors | ❌ Unhides an empty result box with `text-destructive`. No error anywhere. |
| `const { test, ...rest } = themeServer`; `{ ...rest, helloSite }` | ✅ 0 errors | ❌ The call gets `404 AstroActionError NOT_FOUND`. `init()` handles only input errors and `data`, so nothing is shown or logged. |

**The non-input error gap is a parity issue.** `sojourners.church`'s `init.ts` has the same two branches, so a 500, a thrown handler or a network failure also fails silently there.

**Spec options:**
1. **Contract rule:** Theme action names and result shapes are part of the public contract (PRD §9). Sites may add actions but not replace or remove Theme ones.
2. **A type for Sites:** the package exports the type of its actions, and the Site's `server` uses `satisfies` against it. An incompatible override or a removal then fails `astro check`. The Starter Site would include it.
3. **A runtime guard in Theme client code:** check the result's shape and show a fallback error. It costs client JS (NFR-3) and only catches the problem after deploy.

**Decided (Tyler, 2026-11-02):** 1 and 2. No MVP Feature needs a Site to replace a Theme action (PRD §10). The exported type and the action names and result shapes join the public contract (PRD §9).

Still open: whether the Theme's forms should show non-input `ActionError`s, which would be a deliberate change from parity.

## Finding 3: `astro:env/server` is untyped inside the package

**Symptom:** `import { ASTRO_CHURCH_TEST_SECRET } from "astro:env/server"` fails `tsc` in the package: `Module '"astro:env/server"' has no exported member`. Unlike finding 1, this is an error, not a silent `any`.

**Cause:** without a Site, `astro:env/server` only declares `getSecret(key: string): string | undefined` (`types/env.d.ts`). Named variables come from the Site's generated `.astro/env.d.ts`.

**The fix (applied on the spike branch):** an ambient declaration in the package that copies the Site's generated shape:

```ts
// src/env.d.ts
declare module "astro:env/server" {
	export const ASTRO_CHURCH_TEST_SECRET: string;
}
```

It needed three more changes before it was right. Each one failed silently:

| Problem | Symptom | Fix |
|---|---|---|
| `include: ["src/env.d.ts"]` in `tsconfig.json` | `tsc --noEmit` passed while checking only that file (`--listFilesOnly`) | `include: ["src"]` |
| tsdown's declaration build doesn't load the ambient file | `dist/actions.d.ts` had `length: any` (R-1 finding 1 again) | `/// <reference path="env.d.ts" />` at the top of `src/actions.ts`. tsdown drops it from both outputs, so nothing points at a missing file. |
| The entry glob `src/**/*.(ts|js)` matches `.d.ts` | `dist/env.d.ts` was emitted and would have been published. Nothing referenced it, so it didn't clash with the Site's declaration, but only by luck. | `"!src/env.d.ts"` in `entry`. `!src/**/*.d.ts` would cover future ambient files. |

**The names have to be kept in sync by hand:** each variable appears in the integration's `env.schema` and in `src/env.d.ts`. A test that compares the two would catch drift.

`getSecret("…")` needs no declaration, but returns `string | undefined` with no schema behind the type, so every handler has to deal with `undefined` itself. Not used.

## Finding 4: a missing secret isn't caught at deploy time

| Built server | Result |
|---|---|
| With the variable | ✅ `{ ok: true, message: "Hello Tyler", length: 14 }` |
| Without it | Starts and serves pages (200). The first action call returns 500, with `EnvInvalidVariables: … ASTRO_CHURCH_TEST_SECRET is missing` in the server log. |

- The error is thrown when the actions module loads, because the variable is imported at the top level. It takes down every Theme action, not only the one that uses the secret. `sojourners.church` does the same (`new Resend(RESEND_API_KEY)` at module level), so this is parity.
- With finding 2's gap, a Site that forgets `RESEND_API_KEY` deploys successfully, and the subscribe form does nothing.
- Not tested: whether `astro build` fails without the variable. `.env` was present, and Vite loads it at build time.
- **For the spec:** `env.validateSecrets: true`, set by the integration through `updateConfig`, should move the check to server start (untested). That interacts with the planned env checks for enabled Features (replacing `verifyRequiredEnvVars`): a missing secret only matters when its Feature is enabled, and `validateSecrets` doesn't know about Features.

## Finding 5: dev reload (R-4)

Seen once, not tested on purpose: after the handler changed from `{ greeting }` to `{ ok, message }` and tsdown rebuilt `dist/actions.js`, the running `astro dev` kept serving the old handler until it was restarted. The Theme's form showed an empty result box. This matches R-1 finding 4: Astro's dev HMR only watches `srcDir/actions/`, and the package's `dist/` is outside it.

**The watch-mode race came back.** The R-1 fix (`tsdown --watch --no-clean` and a build before the parallel run) only lived on `spike/collections-reexport`, so `pnpm dev` on this branch failed with `Failed to resolve entry for package "astro-church"` until it was reapplied. It needs to reach `main` (spec step 1).

**Astro 7 starts `astro dev` in the background in a non-interactive shell** (`--json`, "Stop: astro dev stop"), and the playground script prints `Done` and exits. A leftover background server can hold port 4321. `astro dev status` and `astro dev stop` show and clear it.

## Other notes
- **The shipped `.d.ts` imports `SafeResult` from `"astro:actions"`.** That's a virtual module, resolved in the Site through `astro/client`. Like `astro/content/config` in R-1, a change in an Astro minor would break the Theme's types (public contract, PRD §9).
- **The action response is devalue-encoded** (`content-type: application/json+devalue`), so raw `curl` output looks like `[{"ok":1,"message":2},true,"Hello Tyler"]`.

## Still open
- **Netlify:** one `astro build` with `@astrojs/netlify`, the only tested host (NFR-2).
- **R-4, on purpose:** does saving the Site's `src/actions/index.ts` pick up a rebuilt package action without a restart? If so, that's a cheap workaround for DX-5.
- **Missing variable at build time**, and whether `validateSecrets` moves the failure to server start.
- **The real subscribe action:** `SubscribeSchema` with its `z.preprocess` fields, Resend, and a handler whose result is a union (`{ ok: false, error, message }` on one path).

## Carried into the spec
1. Theme client code casts `actions` to `typeof server` through a type-only import. No module declaration.
2. Theme actions in the public contract (PRD §9): Sites add, not replace or remove. Export a type for the Site's `server` to `satisfies`, and use it in the Starter Site.
3. Decide whether Theme forms show non-input `ActionError`s (a change from parity).
4. Ambient `src/env.d.ts` for the Theme's env variables, pulled in with `/// <reference>`, excluded from the tsdown entry (`!src/**/*.d.ts`), and kept in sync with the integration's `env.schema` by a test.
5. `tsc --noEmit` for the package in CI, next to R-1's check for `any` in the shipped `.d.ts` files.
6. Missing secrets: `env.validateSecrets`, and how it fits with env checks for enabled Features.
7. `astro:actions` in the shipped types: accept with a pinned Astro range, like R-1 item 5.
8. The R-1 dev-loop fix reaches `main` (R-1 item 6).
