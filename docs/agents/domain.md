# Domain Docs & ADRs

This is a **single-context** repository. Domain knowledge and architecture decisions live in one place:

- **`CONTEXT.md`** (at repo root): the shared mental model — codebase terminology, design decisions, and current state that engineers need to know before contributing.
- **`docs/adr/`**: Architecture Decision Records — one `.md` file per decision, named by date and slug (e.g., `001-clean-urls.md`, `002-i18n-approach.md`).

## When to write / update

### CONTEXT.md

Update this when:

- A design decision is finalized and needs to be understood by anyone reading the code
- Terminology shifts (e.g., "services" becomes "departments")
- A new subsystem lands that others need to know about
- The mental model drifts from reality (stale docs are worse than no docs)

Structure it however works for your team, but include:

- **What is this codebase?** (one paragraph)
- **Key design decisions** — why it's built this way
- **How data flows** — if there's a story (request → fetch JSON → render)
- **Naming conventions** — the vocabulary used in code
- **Gotchas & constraints** — things that surprise people

### docs/adr/

Write an ADR when:

- Choosing between two or more approaches (with tradeoffs)
- Making a decision that's hard to reverse (e.g., switching frameworks)
- Explaining why something is the way it is _now_ (not how it got there)

Name files: `NNN-hyphenated-slug.md` where NNN starts at 001 and increments.

**Template:**

```markdown
# ADR NNN: Title

**Status:** Accepted (or Proposed / Superseded)  
**Date:** YYYY-MM-DD

## Context

Why are we deciding this? What's the problem?

## Decision

What did we choose?

## Rationale

Why this and not the alternatives?

## Consequences

What changes as a result?
```

---

See also: [issue-tracker.md](./issue-tracker.md), [CLAUDE.md](../../CLAUDE.md)
