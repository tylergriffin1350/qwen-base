# Qwen-BASE **Builder's Automated State Engine** — Your AI builder operating system for Qwen Code.

```bash
npx qwen-base
```

**Works on Mac, Windows, and Linux.**

*"Turn Qwen Code from a per-session tool into a workspace that remembers, maintains itself, and never goes stale."*

[The Problem](#the-problem) · [What BASE Does](#what-base-actually-does) · [Commands](#commands) · [Hooks](#hooks) · [MCP Server](#mcp-server) · [Operator Profile](#operator-profile) · [PSMM](#psmm) · [Install](#install)

---

## The Problem

Every Qwen Code session starts fresh. Your workspace structure, project state, active contexts, and accumulated knowledge? Gone. You end up rebuilding context manually every time. Over time, workspace files drift — configs go stale, surfaces aren't updated, projects accumulate without organization.

BASE fixes this by turning Qwen Code into a **maintained workspace**, not a per-session scratchpad.

---

## What BASE Actually Does

1. **Scaffold** — Set up a new workspace with structured data files (workspace.json, operator.json, state.json, entities.json, projects.json)
2. **Pulse** — Daily activation: workspace health briefing, what's changed, what needs attention
3. **Groom** — Weekly maintenance cycle: archive stale items, update contexts, clean surfaces
4. **Audit** — Deep workspace optimization: find drift, fix inconsistencies, optimize structure
5. **Surfaces** — Structured data injection: convert markdown files into context-rich data surfaces
6. **CARL Hygiene** — Maintain CARL domains: archive stale rules, review decisions, clean up

---

## Commands

| Command | What It Does |
|---------|-------------|
| `/base:pulse` | Daily activation — workspace health briefing |
| `/base:groom` | Weekly maintenance cycle |
| `/base:audit` | Deep workspace optimization |
| `/base:scaffold` | Set up BASE in a new workspace |
| `/base:status` | Quick health check (one-liner) |
| `/base:history` | Workspace evolution timeline |
| `/base:audit-claude-md` | Audit Qwen config, generate recommended version |
| `/base:carl-hygiene` | CARL domain maintenance and rule review |
| `/base:surface create` | Create a new data surface (guided) |
| `/base:surface convert` | Convert markdown file to data surface |
| `/base:surface list` | Show all registered surfaces |
| `/base:orientation` | Deep-dive session to define workspace identity |

---

## Hooks

BASE installs Python hooks that run automatically in your Qwen Code sessions:

| Hook | Event | What It Does |
|------|-------|-------------|
| `active-hook.py` | SessionStart | Injects active workspace context (operator, state, projects) |
| `psmm-injector.py` | SessionStart | Per-Session Meta-Memory — tracks session context |
| `backlog-hook.py` | SessionStart | Injects backlog/deferred items from state.json |
| `satellite-detection.py` | SessionStart | Detects PAUL projects and registers them as satellites |
| `operator.py` | SessionStart | Injects operator profile (who you are, always in context) |
| `base-pulse-check.py` | SessionStart | Checks if grooming is overdue and suggests maintenance |
| `apex-insights.py` | Stop | End-of-session analytics — session summary and trends |

---

## MCP Server

BASE includes an MCP server with tools for workspace data management:

| Tool | What It Does |
|------|-------------|
| `base_read_state` | Read current workspace state |
| `base_write_state` | Update workspace state |
| `base_read_entities` | Read entities (tools, platforms, services) |
| `base_write_entities` | Add/update entities |
| `base_read_projects` | Read project registry |
| `base_write_projects` | Add/update projects |
| `base_read_operator` | Read operator profile |
| `base_write_operator` | Update operator profile |
| `base_validate` | Validate workspace data integrity |
| `base_satellite_register` | Register a PAUL project as a satellite |
| `base_psmm_store` | Store per-session meta-memory |
| `base_psmm_retrieve` | Retrieve per-session meta-memory |

---

## Operator Profile

The operator profile (`operator.json`) defines **who you are** — your skills, preferences, constraints, and goals. Once set, this context is injected into every session. No more re-explaining yourself.

---

## PSMM — Per-Session Meta-Memory

PSMM tracks what happens in each session: what you worked on, what decisions were made, what changed. This creates a continuous memory across sessions that Qwen can reference.

---

## How The Ecosystem Fits Together

| Tool | What It Does | How BASE Uses It |
|------|-------------|-----------------|
| **qwen-paul** | Project orchestration (Plan, Apply, Unify) | BASE detects PAUL projects as satellites, tracks their state |
| **carl-qwen** | Dynamic rule injection | BASE runs CARL hygiene — archives stale rules, reviews decisions |
| **qwen-seed** | Typed project incubator | BASE tracks graduated projects in workspace state |
| **qwen-aegis** | Codebase auditing | BASE recommends audits as part of grooming cycles |

---

## Install

```bash
npx qwen-base
```

The installer prompts you to choose:

1. **Global** (recommended) — Available in all Qwen Code projects
2. **Local** — Available in current project only

### What Gets Installed

```
~/.qwen/commands/qwen-base/
├── base.md              Entry point (routing + persona)
├── framework/           Tasks, templates, frameworks (11 commands)
├── commands/            Command definitions
├── hooks/               7 Python hooks for workspace intelligence
├── templates/           operator.json, workspace.json templates
└── base-mcp/            MCP server for workspace data management

~/.qwen/settings.json    Hook registration (merged)
```

---

## Quick Start

```
# 1. Scaffold a new workspace
/base:scaffold

# 2. Define your operator profile
(base guides you through who you are)

# 3. Daily pulse
/base:pulse

# 4. Weekly maintenance
/base:groom

# 5. Deep audit when things feel messy
/base:audit
```

---

## Design Principles

1. **Workspace over sessions** — Your workspace persists, sessions don't
2. **Data over documents** — Structured JSON, not just markdown
3. **Maintained over drifting** — Regular grooming prevents staleness
4. **Detective over prescriptive** — Finds problems, doesn't dictate solutions

---

## License

MIT License.

---

## Author

**Chris Kahler** — [Chris AI Systems](https://github.com/ChristopherKahler)
Adapted for Qwen Code by [tylergriffin1350](https://github.com/tylergriffin1350)

---

**Qwen Code is powerful. BASE makes it reliable.**
