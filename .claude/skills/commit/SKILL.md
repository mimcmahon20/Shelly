---
name: commit
description: Stage and commit current changes with conventional commit format
---

# Commit Skill

Trigger: Run `/commit` to stage and commit current changes.

## Steps

1. Run `git status` and `git diff` (staged + unstaged) to understand what changed.
2. Categorize the changes and generate a commit message using conventional commit format.
3. Stage the relevant files (prefer specific files over `git add -A`).
4. Commit to `main` with the generated message.
5. Do NOT push unless explicitly asked.

## Commit Message Format

```
<type>(<scope>): <short description>
```

### Types

- **feat** — New feature or functionality
- **fix** — Bug fix
- **style** — UI/CSS/layout changes (no logic change)
- **refactor** — Code restructuring (no feature or fix)
- **docs** — Documentation only
- **chore** — Build, config, tooling, dependencies
- **test** — Adding or updating tests
- **perf** — Performance improvement

### Scope

The area of the codebase affected. Use short lowercase names:
- `canvas`, `sidebar`, `nodes`, `engine`, `llm`, `api`, `store`, `ui`, `db`, `types`, `dark`, `docs`, `skills`

### Examples

```
feat(nodes): add transformer node type
fix(engine): handle empty input on router nodes
style(sidebar): adjust spacing in flow list
docs(changelog): update for v0.5.0
refactor(store): simplify flow persistence logic
chore(deps): bump anthropic sdk to 0.73
```

### Rules

- Keep the description under 60 characters, lowercase, no period
- One commit per logical change — don't bundle unrelated changes
- If multiple scopes are affected, use the most significant one or omit the scope: `feat: add dark mode and sidebar split view`
