# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
```

No test framework is configured.

## Architecture

Shelly is a **client-side visual LLM flow builder** built with Next.js 14 App Router. Users create node-based prompt chains that execute sequentially against the Anthropic API (Claude). All data persists in IndexedDB — there is no backend database.

### Core Data Flow

1. User builds a flow of connected nodes on a ReactFlow canvas
2. `executeFlow()` in `src/lib/engine.ts` runs nodes sequentially from root nodes (no incoming edges)
3. LLM calls go through `POST /api/llm/chat` → `AnthropicProvider` (claude-sonnet-4-20250514)
4. Results are tracked per-node and stored via Zustand → IndexedDB

### Node Types (defined in `src/lib/types.ts`, executed in `src/lib/engine.ts`)

- **user-input** — entry point, passes user input forward
- **agent** — LLM call with system prompt + message template. When `toolsEnabled`, runs an agentic tool loop with virtual filesystem tools (view, edit, create_file, list_files)
- **structured-output** — LLM call returning JSON matching a schema (uses tool_use)
- **router** — conditional branching (equals/contains/gt/lt operators)
- **output** — terminal node for final results

Templates use `{{variable}}` interpolation with dot notation for nested access. When multiple inputs converge on a node, data is merged into an object keyed by source node ID.

### State Management

Two Zustand stores with IndexedDB persistence:
- **flowStore** (`src/stores/flowStore.ts`) — flows, nodes, edges, selection state
- **runStore** (`src/stores/runStore.ts`) — run history, per-node results

API key is stored in localStorage.

### Virtual Filesystem (VFS)

Tool-enabled agent nodes operate on a `VirtualFileSystem` (`Record<string, string>`) stored at the flow level as `initialVfs`. During execution, VFS state is shared across all tool-enabled nodes — mutations from one agent are visible to downstream agents. The agentic tool loop runs server-side in the API route (`chatWithTools()`) to avoid multiple client-server round-trips. Tool calls are traced per-node via `ToolCallTrace[]` for UI inspection.

### Streaming & Cost Tracking

SSE events flow from `chatWithTools()`/`chatStream()` → API route → `callLLMStream()`/`callLLMWithTools()` → engine `StreamCallbacks` → `runStore.streamingNode` → `StreamingNodeCard`. Delta events carry text chunks; tool_call events carry `ToolCallTrace`. The `streamingNode` state is ephemeral (not persisted to IndexedDB).

Token usage is split into `inputTokens`/`outputTokens` on `LLMResponse` and `NodeResult`. Cost is calculated via `src/lib/cost.ts` which maps model IDs to per-million-token pricing. The `model` field on `NodeResult` enables accurate cost computation per node.

### Key Files

- `src/lib/engine.ts` — flow execution engine, node processing logic, VFS threading, `StreamCallbacks` wiring
- `src/lib/flowPrompt.ts` — flow-to-markdown prompt generator for export (`generateFlowPrompt()` + graph traversal helpers)
- `src/lib/cost.ts` — model pricing map + `calculateCost()`/`formatCost()` utilities
- `src/lib/vfs.ts` — virtual filesystem tool execution + Anthropic tool definitions
- `src/lib/llm/provider.ts` — LLM provider interface + `callLLMWithTools()` client function + `onDelta` callbacks
- `src/lib/llm/anthropic.ts` — Anthropic SDK integration + `chatWithTools()` agentic loop
- `src/lib/db.ts` — IndexedDB schema (two stores: `flows`, `runs`)
- `src/app/api/llm/chat/route.ts` — API route proxying LLM calls (auth via X-API-Key header), tool-enabled SSE branch
- `src/components/flow/FlowCanvas.tsx` — ReactFlow wrapper with bidirectional Zustand sync (uses debounce + syncing flag to prevent loops)
- `src/components/flow/VfsEditor.tsx` — flow-level VFS file editor (sidebar "Files" tab)
- `src/components/runs/StreamingNodeCard.tsx` — live streaming card with text accumulation, tool call traces, elapsed timer

### UI Stack

shadcn/ui (New York style) with Radix primitives, Tailwind CSS (dark mode via class), Lucide icons. Path alias: `@/*` → `./src/*`.

## Self-Improvement Protocol

After every user follow-up that involves code changes, bug reports, corrections, or clarifications about how this codebase works, you MUST pause and evaluate:

1. **CLAUDE.md update** — Does this interaction reveal missing or incorrect information in this file? Examples: undocumented patterns, architectural details, gotchas, conventions, or corrections. If so, update CLAUDE.md immediately.

2. **Skill creation** — Is there a repeatable workflow emerging from this interaction that would benefit from a dedicated skill (slash command)? Examples: a specific deploy process, a repeated refactoring pattern, a common debugging workflow. If so, create or propose a skill for it.

Ask yourself after each follow-up:
- "Did I get something wrong that better documentation would have prevented?"
- "Is the user repeating a request pattern that a skill would streamline?"
- "Did I learn something about this codebase that future sessions should know?"

When updating this file, keep entries concise and in the appropriate existing section. When creating skills, place them in `.claude/skills/`.

3. **Changelog update** — After any feature, fix, or notable change, run `/update-docs` or manually update `docs/CHANGELOG.md` with the change. Follow semver (patch for fixes, minor for features).

## Documentation

- `docs/CHANGELOG.md` — Version history with all notable changes
- `.claude/skills/update-docs.md` — `/update-docs` skill for updating changelog + docs after changes
- `.claude/skills/self-improve.md` — `/self-improve` skill for meta-improvement of CLAUDE.md and skills
- `.claude/skills/commit.md` — `/commit` skill for staging and committing with conventional commit format

## Commit Convention

All commits use conventional format: `type(scope): description`. Types: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`, `test`, `perf`. Commits go to `main` during initial development.
