# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One spec area per directory: `.scratch/<slug>/` (the areas and their order are in `docs/next-steps.md`)
- The spec is `.scratch/<slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings). New specs and tickets get `**Status:** ready-for-human`
- Tickets follow the template below
- When a ticket is implemented and committed, set `**Status:** resolved` and tick its acceptance criteria. A blank `## Retro` doesn't block resolving: leave the placeholder in place
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## Ticket template

Each ticket is a vertical slice with observable behaviour, sized for one to three focused sessions. The Theme Author writes the stub and the production code; the test list drives TDD (see `docs/workflow.md`).

```md
# NN: <behaviour, in glossary terms>

**Spec:** `.scratch/<slug>/spec.md` · **PRD:** FR-…, DX-… · **ADRs:** …
**Blocked by:** NN, NN (or None)
**Status:** ready-for-human

## Behaviour
What a Site Developer, Site Editor or visitor can observe once this is done. 2–4 sentences.

## Acceptance criteria
- [ ] …

## Public contract
What this adds to or changes in PRD §9 (options, entry points, collections, env vars, URLs, CMS). "None" is a valid answer. Breaking changes need a changeset and upgrade notes.

## Seams and test list
Seam: <exported function | integration hook | built Starter Site>.
- [ ] <test name> (I write)
- [ ] <test name>
- [ ] Ported: <sojourners.church test file> (passes unchanged | change approved: …)
Build and smoke checks: <what must build or exist in the output>.
Manual checks: <dev server, CMS, URL parity>.

## Done when
- [ ] Each acceptance criterion traced to a test, a build or smoke check, or a manual check
- [ ] `pnpm verify` green; the Starter Site builds if routes, collections or config changed
- [ ] Reviewed; findings resolved or logged here
- [ ] Changeset added if the change is user-visible
- [ ] PRD, ADR, GLOSSARY or README updated if anything changed

## Learning goal (optional)

## Comments

## Retro
Learned: · Surprised by: · Next time:
```

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The Theme Author will normally pass the path or the issue number directly.
