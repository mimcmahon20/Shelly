# Changelog

All notable changes to Shelly are documented in this file.

Format: Versions are grouped by release. Each entry includes the date and a summary of changes.

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
