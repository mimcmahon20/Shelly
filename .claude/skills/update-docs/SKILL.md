---
name: update-docs
description: Update changelog and docs after implementing a feature, fix, or notable change
---

# Update Docs Skill

Trigger: Run `/update-docs` after implementing a feature, fixing a bug, or making any notable change.

## Steps

1. **Identify what changed** — Review the recent commits or current conversation to understand what was added, changed, or fixed.

2. **Update the changelog** — Edit `docs/CHANGELOG.md`:
   - If the change fits the current unreleased version at the top, add it under the appropriate heading (`Added`, `Changed`, `Fixed`, `Removed`).
   - If a new version is warranted (major feature milestone), create a new version section at the top with today's date. Bump the minor version for features, patch for fixes.
   - Keep entries concise — one line per change.

3. **Update README.md if needed** — The README is a quickstart guide focused on setup, commands, and usage. Update it if:
   - New commands or scripts were added
   - Setup steps changed (new env vars, dependencies, config)
   - New node types were added (update the Node Types table)
   - The tech stack changed
   - Do NOT bloat the README with feature details — keep it practical and action-oriented.

4. **Update CLAUDE.md if needed** — If the change introduces new architecture, files, patterns, or conventions, update the relevant section in `CLAUDE.md` so future sessions have accurate context.

5. **Report** — Summarize what documentation was updated.

## Version Numbering

- **Patch** (0.x.Y): Bug fixes, small tweaks
- **Minor** (0.X.0): New features, new node types, new UI sections
- **Major** (X.0.0): Breaking changes, major rewrites (reserve for post-1.0)

## Changelog Format

```markdown
## vX.Y.Z — YYYY-MM-DD

### Added
- Description of new feature

### Changed
- Description of change to existing functionality

### Fixed
- Description of bug fix

### Removed
- Description of removed feature
```
