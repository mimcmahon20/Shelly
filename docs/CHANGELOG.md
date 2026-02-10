# Changelog

All notable changes to Shelly are documented in this file.

Format: Versions are grouped by release. Each entry includes the date and a summary of changes.

---

## v0.7.3 — 2026-02-09

### Added
- Export dropdown with three options: JSON export (existing), markdown guide export, and copy-to-clipboard
- Flow implementation prompt generator (`src/lib/flowPrompt.ts`) — produces a structured markdown document with schema reference, execution walkthrough, and embedded flow JSON
- shadcn/ui dropdown menu component

---

## v0.7.2 — 2026-02-05

### Fixed
- Flow versions now snapshot and restore VFS (virtual filesystem) files — previously only nodes and edges were captured

---

## v0.7.1 — 2026-02-05

### Added
- "Smart Game Editor" example flow with 3-way routing: generate, easy edit (Sonnet 4.5), hard edit (Opus 4.6)
- Easy edits (cosmetic changes) routed to Sonnet for speed; hard edits (structural changes) routed to Opus for quality
- DB migration v5 auto-inserts the new flow for existing users

---

## v0.7.0 — 2026-02-05

### Added
- Real-time streaming in run drawer — live text, tool calls, and blinking cursor as the model responds
- Streaming status card with spinner, elapsed timer, and auto-scroll during execution
- Per-node and total run cost tracking based on API pricing (input/output token split)
- Token breakdown tooltip on node result badges (hover to see input vs output)

---

## v0.6.2 — 2026-02-05

### Added
- Duplicate flow button — copies nodes, edges, VFS files, and saved versions (but not runs or test batches)

---

## v0.6.1 — 2026-02-05

### Changed
- Rethemed VFS example flow as "Educational Game Builder" with classifier → router branching (generate vs edit paths)
- Generate path: Planner (Haiku) designs visual brief, Generator (Opus) builds game with VFS tools
- Edit path: Editor (Opus) makes surgical edits to existing game files
- Enforced design rules: no emojis, no gradients, bold flat colors, start/end screens, scoring, timer

---

## v0.6.0 — 2026-02-05

### Added
- Agentic tool-call loop for agent nodes with virtual filesystem (VFS) tools: `view`, `edit`, `create_file`, `list_files`
- Virtual filesystem shared across tool-enabled nodes within a single run execution
- Tool call trace display in node results (expandable per-tool input/output with iteration tracking)
- VFS snapshot viewer in node results and final VFS section in run detail
- "Files" tab in sidebar with VFS editor for seeding initial files per flow
- "Enable Tools" toggle and "Max Tool Iterations" config on agent nodes
- Tools badge indicator on agent nodes in the canvas

---

## v0.5.0 — 2026-02-02

### Added
- Dark mode support (class-based Tailwind toggle)
- Split view layout for right sidebar
- Instructions / how-to modal for new users

---

## v0.4.0 — 2026-02-01

### Added
- Flow versioning system
- Parameterized user inputs
- Batch execution support
- Tech debt cleanup and internal refactoring

---

## v0.3.0 — 2026-01-30

### Added
- HTML renderer node output
- Streaming responses from LLM calls
- Increased token limit for completions
- Example flows and Opus model support

### Fixed
- Corrected model name identifiers for providers

---

## v0.2.0 — 2026-01-29

### Added
- OpenAI and Anthropic provider integrations
- Multi-provider LLM architecture

---

## v0.1.0 — 2026-01-29

### Added
- Initial project scaffold (Next.js 14 App Router)
- ReactFlow canvas with node-based flow builder
- Core node types: user-input, agent, structured-output, router, output
- Flow execution engine with sequential processing
- IndexedDB persistence via Zustand stores
- Template interpolation with `{{variable}}` syntax
