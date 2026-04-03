---
name: base:scaffold
description: Set up BASE in a new workspace
argument-hint: "[--full]"
allowed-tools: [Read, Write, Edit, Glob, Bash, AskUserQuestion]
---

<objective>
Guided workspace setup — scan, configure, install BASE infrastructure. Optional --full mode adds operational templates.

**When to use:** First-time BASE installation, "set up base", "scaffold my workspace".
</objective>

<execution_context>
@{~/.qwen/commands/qwen-base/tasks/scaffold.md}
@{~/.qwen/commands/qwen-base/templates/workspace-json.md}
@{~/.qwen/commands/qwen-base/templates/workspace-json.md}
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Follow task: @{~/.qwen/commands/qwen-base/tasks/scaffold.md}
</process>

<success_criteria>
- [ ] .base/ directory structure created
- [ ] workspace.json generated from scan
- [ ] state.json initialized
- [ ] Hooks and MCP servers installed (if --full)
</success_criteria>
