---
name: base:audit-claude-md
description: Audit QWEN.md against the QWEN.md Strategy and generate a compliant version
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

<objective>
Audit the project's QWEN.md for strategy compliance, interactively rewrite it section by section, and route operational rules to CARL or an artifact.

**When to use:** "audit claude md", "check my QWEN.md", "rewrite my QWEN.md", after major workspace changes.
</objective>

<execution_context>
@{~/.qwen/base/framework/frameworks/claudemd-strategy.md}
@{~/.qwen/base/framework/templates/claudemd-template.md}
@{~/.qwen/base/framework/tasks/audit-claude-md.md}
</execution_context>

<context>
$ARGUMENTS

@QWEN.md
</context>

<process>
Follow task: @{~/.qwen/base/framework/tasks/audit-claude-md.md}

Key gates (do NOT skip):
1. Load strategy + template BEFORE reading user's QWEN.md
2. Present full audit classification — wait for user approval
3. Detect CARL — wait for user decision on rule routing
4. Propose each section individually — wait for approval per section
5. Write to CLAUDE.base.md (never overwrite QWEN.md)
</process>

<success_criteria>
- [ ] Strategy framework loaded first
- [ ] Every line classified (KEEP/REMOVE/RESTRUCTURE/CARL_CANDIDATE)
- [ ] User approved audit before rewriting began
- [ ] CARL detection completed, rule routing decided
- [ ] Each section approved individually
- [ ] Final CLAUDE.base.md under 100 lines
- [ ] Original QWEN.md untouched
</success_criteria>
