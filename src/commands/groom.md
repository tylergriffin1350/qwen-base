---
name: base:groom
description: Weekly workspace maintenance cycle
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion]
---

<objective>
Structured weekly maintenance — review each workspace area, update statuses, archive stale items, reduce drift.

**When to use:** Weekly maintenance, "groom my workspace", "run grooming".
</objective>

<execution_context>
@{~/.qwen/commands/qwen-base/tasks/groom.md}
@{~/.qwen/commands/qwen-base/context/base-principles.md}
@{~/.qwen/commands/qwen-base/frameworks/audit-strategies.md}
</execution_context>

<context>
$ARGUMENTS

@.base/workspace.json
@.base/data/state.json
</context>

<process>
Follow task: @{~/.qwen/commands/qwen-base/tasks/groom.md}
</process>

<success_criteria>
- [ ] All workspace areas reviewed
- [ ] Stale items addressed
- [ ] state.json updated with groom results
- [ ] Drift score recalculated
</success_criteria>
