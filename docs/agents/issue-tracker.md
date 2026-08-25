# Issue Tracker

Issues for this repo live in **GitHub Issues** at https://github.com/bpbelen/betterlegazpi/issues.

## Workflow

Skills like `to-tickets`, `to-spec`, and `triage` (when installed) read from and write to GitHub Issues using the `gh` CLI.

### Creating issues from Claude

When an agent (or you) needs to create a ticket:

```bash
gh issue create --title "..." --body "..." [--label bug,enhancement]
```

### Reading issues

Agents can list or search issues:

```bash
gh issue list --state open
gh issue view <number>
```

### PR-as-request surface

This repo does **not** route PRs into the triage queue. PRs are for code review only. Use GitHub Issues to request changes or propose features.

---

See also: [domain.md](./domain.md), [CLAUDE.md](../../CLAUDE.md)
