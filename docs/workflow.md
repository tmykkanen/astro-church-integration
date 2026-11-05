# Astro Church development workflow

How the Theme gets built: developer-led, spec-driven, test-first. The Theme Author (Tyler) writes the production code; the agent helps plan, research, draft tests, explain, debug and review. Adapted from Steward's workflow (`~/Repos/@tmykkanen/steward/docs/workflow.md`).

**Adopted:** 2026-10-31, after discovery produced the approved [PRD](prd/PRD.md).

## Goals

1. Tyler makes the important technical decisions.
2. Tyler writes the production code and understands it well enough to debug, change, test and maintain it.
3. The agent helps think, learn, plan, test, debug and review. It doesn't routinely implement.
4. Working software ships in small, verifiable increments, test-first where tests pay off, at a sustainable pace.

## The workflow

```
 ONCE, BEFORE THE SPEC (Tyler builds, agent helps; branch spike/<name>)
 0 Spikes ──► result recorded in docs/research/ ──► reopen an ADR if a spike fails

 PER SPEC AREA (plan mode; agent writes docs)
 1 Discover & decide ──► 2 Spec (seams first) ──► 3 Tickets (vertical, with edges)
                                                        │
 PER TICKET (fresh session, branch t/<spec>-NN)         ▼
 4 Test list ──► 5 RED ──────────► 6 GREEN ──────────► 7 REFACTOR ──┐
   agent drafts   agent drafts 1     YOU write            YOU, tests   │ next test
   you approve    test; you review   production code      stay green   │
                  and run it         (help mode on demand)             │
                        ▲──────────────────────────────────────────────┘
                                                        │ test list done
                                                        ▼
 8 Verify ──► 9 Review ──► 10 Fix ──► 11 Commit
   verify,      reports      YOU        you commit;
   build,       only                    end of spec: doc updates
   manual
```

**Tyler writes production code** at steps 0, 6, 7 and 10, and nowhere else unless granting an `exception:`.
**The agent writes test code** at step 5, and at step 10 when asked to close test gaps. It writes docs at steps 0–3 and 11 when asked.

### 0. Spikes (help mode while building; plan mode to record)

- **Purpose:** close PRD risks R-1 to R-4 before the spec depends on them. The list is in `docs/next-steps.md`.
- **Rules:** spike code stays on a `spike/<name>` branch and never merges to `main`. Each spike answers one question and takes about one session.
- **Output:** a short note in `docs/research/` with the question, what was tried, the result and what it means for the spec. If a spike fails, the affected ADR is reopened before the spec is written.

### 1. Discover and decide (plan mode)

- **Purpose:** settle open questions before code.
- **Tyler:** answers grilling questions, one at a time; approves every decision, glossary term and ADR.
- **Agent:** runs `grill-with-docs`, looks up facts in this repo, `sojourners.church` and Astro's docs, drafts doc updates.
- **Output:** PRD, `docs/adr/`, `GLOSSARY.md`.
- **When:** when a spec area or ticket hits an unanswered question. Discovery for the MVP is done.

### 2. Spec (plan mode, adapted `/to-spec`)

- **Purpose:** one durable record of the implementation decisions for one area of the spec order in `docs/next-steps.md`.
- **Rule:** reference PRD requirements by number ("FR-7, DX-5") instead of repeating them; add only the new detail.
- **Approval:** Tyler approves the test seams before the spec is written, then the scope and out-of-scope list.
- **Output:** `.scratch/<slug>/spec.md`.

### 3. Tickets (plan mode, adapted `/to-tickets`)

- Vertical slices, each producing observable behaviour (a route renders, an option is validated, a CMS file is served), sized for one to three focused sessions, each with "Blocked by" edges.
- **Approval:** Tyler approves granularity and edges.
- **Output:** `.scratch/<slug>/issues/NN-<slug>.md` from the template in `docs/agents/issue-tracker.md`, `Status: ready-for-human`.

### 4–7. TDD with manual implementation (test and help modes)

See the TDD policy below. Tyler owns every interface: exported names, option shapes, schemas, route patterns. Tyler writes the stub; the agent never does.

### 8. Verify

`pnpm verify`, then the checks the ticket names: a Starter Site build, the smoke checks, and a manual look in the Starter Site's dev server. Passing tests aren't proof.

`pnpm verify` runs, stopping at the first failure: Biome, the package typecheck (`tsc`, `tsc -p client` for the CMS bundle's entries, and `astro check` on the Theme's `.astro` files), the no-globals check, Vitest (the package's unit tests, including the no-globals check's own), the CMS bundle build, then the Starter Site's `astro check` and the build test. The order is in the package-skeleton spec. CI runs it on every push and PR.

Lefthook (`lefthook.yml`) backs this up. Pre-commit runs Biome on the staged files and stages its fixes, and pre-push runs `pnpm verify`.

### 9. Review (review mode)

`/mattpocock-skills:code-review` against `main`, plus four axes:

- **Public contract:** does anything in PRD §9 change (options, entry points, collection names and schemas, env var names, URLs, the CMS editing experience)? Is it breaking by §9's definition? Does it need a changeset and upgrade notes?
- **Security and footprint:** Action input validation, secrets reaching client bundles or logs, extra client JS or CSS per page against NFR-3.
- **Tests:** a map from each acceptance criterion to its test or manual check; weak or coupled assertions.
- **Understanding:** two or three questions asking Tyler to explain their own code.

It reports findings with proposed fixes and changes nothing. Tyler decides what to act on.

### 10–11. Fix and commit

Tyler fixes, commits and fast-forwards `main` (history stays linear). A user-visible change gets a changeset (`pnpm changeset`). At the end of each spec: doc updates.

### Which doc to update

| What implementation taught us | Update |
|---|---|
| Product behaviour changed or was clarified | PRD, and the spec if still active |
| A real, hard-to-reverse trade-off | New ADR |
| A new or sharper term | `GLOSSARY.md` |
| A coding convention or Astro gotcha emerged | `docs/research/` for evidence; the package README if Site Developers need it |
| A later ticket's acceptance criteria are wrong | That ticket, before starting it |
| A test seam was wrong | The spec's Testing decisions |
| The public contract changed | README upgrade notes and a changeset |

Never deviate from a ticket silently: change the ticket, then the code.

### Sizing

- **No ticket:** a fix of one session or less with no new rule. Bugs get a failing regression test first.
- **One loose ticket** (in an existing spec or `.scratch/misc/`): one behaviour, one to three sessions.
- **Spec → tickets:** anything that is a spec area in `docs/next-steps.md` or has several behaviours.
- **A ticket past three sessions:** split by behaviour (happy path → validation → edge cases → polish).

## TDD policy

### Default

**The agent drafts tests one at a time from an approved test list. Tyler reviews each one, runs it, and sees it fail for the right reason, then writes the production code.**

Tyler writes the test personally:

- for the **first test of each new kind**: first unit test in the package, first test against a built Starter Site, first smoke check;
- for any ticket whose learning goal is testing.

Table-driven tests (option validation rows, URL lists) may be drafted as one batch, since each row is one behaviour. Expected URL sets come from the Sojourners snapshot or the ticket, not from running the new code.

### Ported tests

The `sojourners.church` unit tests (`tests/` there) move into the package and must pass (PRD §8a.1). They are the parity baseline. The agent may suggest changes to them, but changes a ported test only after Tyler approves that specific change, even in `test:` mode. Moving a test file without changing its assertions still needs a word from Tyler first.

### The cycle

1. **Define the behaviour.** The agent turns acceptance criteria into a test list (names only, glossary terms). Tyler edits and approves it and marks the tests Tyler will write.
2. **Interface.** Tyler writes the stub, throwing `"not implemented"`.
3. **Red.** The agent drafts the next test. Tyler reviews it against the checklist, runs it, and confirms it fails on the behaviour: the not-implemented error or an assertion, not an import, type or setup error.
4. **Green.** Tyler writes the smallest change that passes, using help mode as needed.
5. **Run the file.** Confirm green.
6. **Refactor.** Tyler refactors while green.
7. **Regression.** `pnpm verify` before committing; a Starter Site build when routes, collections or config changed.

### When things go off-script

- **Passes immediately:** stop. Either the behaviour already exists (keep the test only if it documents a distinct criterion, noted as characterisation) or the test is weak. Temporarily break the production line it covers; if it still passes, rewrite it.
- **Fails for the wrong reason:** the agent fixes the test or harness. If that needs production code (an export, a type), the agent stops and says so.
- **Coupled to the implementation** (mocks the Theme's own modules, asserts call order, snapshots whole HTML): rewrite it through the public seam.
- **Exceptions to red-first:** characterisation tests, ported tests, pure refactors, gaps found at review. Do the break-it check and note it in the ticket's Comments.
- **Behaviour that only a build shows** (route injection, collections re-export, Tailwind `@source`, CMS files): the test is a build or smoke check, or a manual check named in the ticket, not a unit test.

### Checklist for every AI-drafted test

1. Which acceptance criterion does it prove? If none, delete it or add the criterion.
2. Would it fail if the behaviour were missing or wrong?
3. Are expected values literals from the spec, the PRD or the Sojourners snapshot?
4. Does it go only through the seam (an exported function, the integration's hooks, built output)?
5. Are boundaries covered: a Feature disabled, an option missing or invalid, an env var missing?
6. One behaviour per test, named as a sentence in glossary terms?
7. Minimal fixtures, and fictional content only?

### Test layers

| Layer | Tool | What goes there |
|---|---|---|
| Unit | Vitest | Pure logic and content helpers: the ported tests (content getters, navigation, scripture parsing, URL state, env checks, the subscribe Action), integration option validation |
| Build | `astro check` and `astro build` on the Starter Site, from the workspace and from the packed tarball | Types, route injection, collections and Actions re-exports, Tailwind classes, fonts, `env.schema` (PRD §8a.2–3) |
| Smoke | A script over the built Starter Site | Every Feature route renders, `/cms` and its config files exist, the expected URL set is produced (PRD §8a.4) |
| Manual | Dev server, deploy preview | Hot reload (DX-5), the CMS workflow, URL parity against the Sojourners snapshot (PRD §8a.5) |

Browser end-to-end tests are out of the MVP (PRD §8a.6).

## Repository layout

```
GLOSSARY.md             glossary only
README.md               repo overview (the package README is the MVP's docs, DX-4)
AGENTS.md               modes plus pointers (short)
docs/prd/PRD.md         product requirements (approved)
docs/workflow.md        this document
docs/next-steps.md      what comes next, in order
docs/adr/               hard-to-reverse decisions
docs/research/          primary-source research and spike results
docs/agents/            tracker conventions, ticket template, labels, domain
packages/astro-church/  the Theme (production code)
playground/             the Starter Site, which doubles as the playground (production code)
.scratch/<slug>/spec.md and issues/NN-<slug>.md
```

- `.scratch/` is committed despite its name; the skills expect it.
- No separate test plans: seams live in the spec, test lists in the ticket.
- No external issue tracker.
- **Committed:** all docs, specs, tickets (with Comments).
- **Temporary:** scratch experiments, `spike/*` branches, the local Sojourners content snapshot, `.claude/exception` (all gitignored or unmerged).

## Agent instructions

The modes live in `AGENTS.md` under **Developer-led workflow**, so every session loads them:

| Mode | The agent may |
|---|---|
| `plan:` | Explore, ask, and write docs and tooling config |
| `test:` | Draft and run test code for the named ticket, one test at a time; name any production code a test needs and stop |
| `help:` (the default) | Read, run commands and explain, climbing the hint ladder one rung per request; repo files stay unchanged |
| `review:` | Review the diff against `main` on spec, standards, public contract, security and footprint, tests, and explain-back questions; report only |
| `exception:` | Write only the production code named, logged in the ticket |

**Backstop.** `.claude/hooks/guard-production.mjs`, registered as a `PreToolUse` hook in `.claude/settings.json`, blocks the agent's Edit and Write tools on production files: everything under `packages/*/`, `playground/` and `starter/`, except test code and Markdown. To grant an exception, run `! touch .claude/exception`, and `! rm .claude/exception` when it's done. The flag is gitignored, and a permission rule stops the agent creating it with its file tools. Shell edits aren't covered by the hook; `AGENTS.md` covers those.

Use separate sessions as well: one for planning, a fresh one per ticket, a fresh one for review. Tyler makes the commits.
