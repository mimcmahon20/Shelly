# Shelly

A visual LLM flow builder. Create node-based prompt chains that execute sequentially against Claude and other LLM providers. All data stays client-side in IndexedDB.

## Quickstart

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setup

You'll need an Anthropic API key. Enter it in the app settings — it's stored in localStorage (never sent to any server other than Anthropic's API).

## Commands

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint check
```

## Usage

1. Create a new flow from the sidebar
2. Add nodes to the canvas: **user-input**, **agent**, **structured-output**, **router**, **output**
3. Connect nodes by dragging edges between them
4. Configure each node (system prompts, templates, schemas, routing conditions)
5. Use `{{variable}}` syntax in templates to reference upstream node outputs
6. Run the flow — nodes execute sequentially from root to leaf

## Node Types

| Node | Purpose |
|------|---------|
| **user-input** | Entry point — passes user input forward |
| **agent** | LLM call with system prompt + message template |
| **structured-output** | LLM call returning JSON matching a defined schema |
| **router** | Conditional branching (equals, contains, gt, lt) |
| **output** | Terminal node for displaying final results |

## Tech Stack

- Next.js 14 (App Router)
- ReactFlow (canvas)
- Zustand + IndexedDB (state & persistence)
- shadcn/ui + Tailwind CSS (UI)
- Anthropic SDK (LLM provider)

## Changelog

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for version history.
