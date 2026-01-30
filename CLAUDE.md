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
- **agent** — LLM call with system prompt + message template
- **structured-output** — LLM call returning JSON matching a schema (uses tool_use)
- **router** — conditional branching (equals/contains/gt/lt operators)
- **output** — terminal node for final results

Templates use `{{variable}}` interpolation with dot notation for nested access. When multiple inputs converge on a node, data is merged into an object keyed by source node ID.

### State Management

Two Zustand stores with IndexedDB persistence:
- **flowStore** (`src/stores/flowStore.ts`) — flows, nodes, edges, selection state
- **runStore** (`src/stores/runStore.ts`) — run history, per-node results

API key is stored in localStorage.

### Key Files

- `src/lib/engine.ts` — flow execution engine, node processing logic
- `src/lib/llm/provider.ts` — LLM provider interface
- `src/lib/llm/anthropic.ts` — Anthropic SDK integration
- `src/lib/db.ts` — IndexedDB schema (two stores: `flows`, `runs`)
- `src/app/api/llm/chat/route.ts` — API route proxying LLM calls (auth via X-API-Key header)
- `src/components/flow/FlowCanvas.tsx` — ReactFlow wrapper with bidirectional Zustand sync (uses debounce + syncing flag to prevent loops)

### UI Stack

shadcn/ui (New York style) with Radix primitives, Tailwind CSS (dark mode via class), Lucide icons. Path alias: `@/*` → `./src/*`.
