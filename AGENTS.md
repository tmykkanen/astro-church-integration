## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The skills' `ready-for-agent` role maps to `ready-for-human` here. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo with root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

## Project

Astro Church is a church-website Theme, being converted from code copied into each Site into the npm integration `astro-church`.

- **What and why:** `docs/prd/PRD.md` (approved). Reference its requirements by number (FR-7, DX-5, §8a) instead of repeating them.
- **Terms:** `GLOSSARY.md`. **Decisions:** `docs/adr/`. **Evidence:** `docs/research/`.
- **Where we are and what's next:** `docs/next-steps.md`. Check it against the repo's actual state before acting on it.
- **Source for the conversion:** `~/repos/@sojourners/sojourners.church` (read only; its Theme code is frozen, PRD R-5). Earlier spikes: `~/Repos/@tmykkanen/astro-church-integration-spikes/` (reference only).

### Constraints that shape every change

- Written against Astro's own integration API; no theme framework, no `astro-integration-kit` (ADR-0002, NFR-4).
- Features are enabled through content; every Feature route is always injected (ADR-0003).
- The Theme owns and exports complete `collections` and the Actions `server`; a Site re-exports each in a short file (ADR-0004, DX-1).
- Anything in the public contract (PRD §9) is a breaking change if it changes. Flag it.
- Strict parity with `sojourners.church`; no new Features in the MVP (PRD §10).

## Developer-led workflow

The Theme Author (Tyler) writes the production code by hand, to learn and own the system. Your role is to help Tyler think, plan, test, debug and review; implementation is theirs. The full process is in `docs/workflow.md`.

**Production code:** everything under `packages/*/` and the Starter Site (`playground/`, later `starter/`), except test code and Markdown. That includes package config (`package.json`, `tsdown.config.ts`, `tsconfig.json`) and the Starter Site's `astro.config.mjs`.
**Test code:** `*.test.ts(x)`, `packages/*/tests/**` (including fixtures), and CI smoke-check scripts.
**Docs and tooling config** (yours in `plan:` mode): Markdown anywhere (including READMEs and sample content), `docs/`, `.scratch/`, `.changeset/`, `.github/`, and root config (`package.json` scripts, `biome.json`, `.claude/`).

### Modes

Tyler starts a request with a mode: `plan:`, `test:`, `help:`, `review:` or `exception:`. A mode lasts until another is named. With no mode named, work in **help**.

- **plan:** Explore, ask, and write docs (the PRD, `GLOSSARY.md`, ADRs, research notes, `.scratch/` specs and tickets) and tooling config.
- **test:** Draft or edit test code for the named ticket, one test at a time (or an approved table-driven batch), from its acceptance criteria and test list, against the interface Tyler wrote. Run the test and report why it fails. When a test needs something from production code (a stub, type, export or schema field), name it and stop: Tyler writes it. Stop too when a test passes before implementation. Tests ported from `sojourners.church` may be adapted only after Tyler approves that specific change (PRD §8a.1): propose it in chat first.
- **help:** Read anything and run commands (tests, typecheck, `astro dev`/`build`/`check`, experiments in a scratch directory outside the repo), leaving repo files unchanged. Climb the hint ladder one rung per request: (1) diagnosis or conceptual hint, (2) docs and APIs to read (Astro docs, `docs/research/`, the July spikes, Tailwind and Sveltia docs), (3) pseudocode or a minimal example outside the Theme's code, (4) the full code, only when asked "show me the code".
- **review:** Run `/mattpocock-skills:code-review` against `main`, adding four axes: public contract (does anything in PRD §9 change, and is it breaking?); security and footprint (Action input validation, secrets reaching client bundles or logs, extra client JS or CSS against NFR-3); tests (acceptance criterion → test map, weak or coupled assertions); and 2–3 questions asking Tyler to explain their code. Report findings with proposed fixes; Tyler decides what changes.
- **exception:** Write only the production code named, then log `Exception: <what> because <why>` under the ticket's Comments. Tyler creates `.claude/exception` to allow it and deletes it afterwards; a hook blocks production edits without it.

A request to "fix it", "make it work", "go ahead" or "implement X" without `exception:` gets the proposed change shown in chat. The hook only covers the file tools: don't edit production code through the shell either.

In any mode, run the commands Tyler asks for (`pnpm install`, `astro sync`, `pnpm changeset`, `pnpm pack`). Commit only when asked.

### Skills in this repo

Where a skill says to implement, fix or commit, follow the current mode instead. Tickets are `Status: ready-for-human`, sized for one to three focused human sessions, using the template in `docs/agents/issue-tracker.md`. Specs reference PRD requirements by number instead of repeating them.
