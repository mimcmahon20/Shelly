---
name: self-improve
description: Review interaction and update CLAUDE.md or create new skills based on learnings
---

# Self-Improve Skill

Trigger: Run `/self-improve` after completing a task or receiving a follow-up correction.

## Steps

1. **Review the interaction** — Look at what the user corrected, clarified, or repeated.

2. **Check CLAUDE.md** — Read `CLAUDE.md` and determine if any section is missing, outdated, or wrong based on what you just learned. If so, edit it.

3. **Check for skill opportunities** — If the user's request follows a pattern that has come up before (or is likely to recur), propose or create a new skill in `.claude/skills/`.

4. **Report** — Briefly tell the user what you updated and why.

## Examples of when to update CLAUDE.md

- You assumed a wrong file path or pattern and the user corrected you
- A new node type, store, or convention was added that isn't documented
- A build/lint/deploy step changed
- You discovered an implicit rule (e.g., "always use X pattern for Y")

## Examples of when to create a skill

- The user repeatedly asks you to run a specific sequence of commands
- A common refactoring pattern emerges (e.g., "add a new node type")
- A debugging workflow is used more than once
