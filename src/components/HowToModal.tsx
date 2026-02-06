'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Upload, Play, Square, Star, Settings, ArrowRight,
  ChevronLeft, ChevronRight, BarChart3, Radar, Table,
  GitBranch, MessageSquare, Braces, Route, MonitorPlay, Code,
} from 'lucide-react';

interface HowToModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono leading-none">
      {children}
    </kbd>
  );
}

function InlineIcon({ icon: Icon, className }: { icon: React.ComponentType<{ className?: string }>; className?: string }) {
  return <Icon className={`inline h-3.5 w-3.5 align-text-bottom mx-0.5 ${className ?? ''}`} />;
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mr-1.5 shrink-0">
      {n}
    </span>
  );
}

export function HowToModal({ open, onOpenChange }: HowToModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How to Use Shelly</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm">

          {/* Getting Started */}
          <section>
            <h3 className="font-semibold text-base mb-2">Getting Started</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <StepNumber n={1} />
                Click <InlineIcon icon={Settings} /> <strong>Settings</strong> in the top bar and add your Anthropic API key.
              </p>
              <p>
                <StepNumber n={2} />
                Click <InlineIcon icon={Plus} /> <strong>New</strong> to create a flow, then select it from the dropdown.
              </p>
            </div>
          </section>

          <Separator />

          {/* Node Types */}
          <section>
            <h3 className="font-semibold text-base mb-2">Node Types</h3>
            <div className="grid grid-cols-1 gap-2 text-muted-foreground">
              <div className="flex items-start gap-2 rounded-md border p-2">
                <InlineIcon icon={MessageSquare} className="text-blue-500 mt-0.5" />
                <div><strong>User Input</strong> — Entry point that passes user text into the flow.</div>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-2">
                <InlineIcon icon={MonitorPlay} className="text-violet-500 mt-0.5" />
                <div><strong>Agent</strong> — LLM call with a system prompt and human message template.</div>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-2">
                <InlineIcon icon={Braces} className="text-amber-500 mt-0.5" />
                <div><strong>Structured Output</strong> — LLM call returning JSON matching a defined schema (uses tool_use).</div>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-2">
                <InlineIcon icon={Route} className="text-green-500 mt-0.5" />
                <div><strong>Router</strong> — Conditional branching with equals, contains, greater-than, or less-than operators.</div>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-2">
                <InlineIcon icon={GitBranch} className="text-orange-500 mt-0.5" />
                <div><strong>Output</strong> — Terminal node that displays the final result.</div>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-2">
                <InlineIcon icon={Code} className="text-pink-500 mt-0.5" />
                <div><strong>HTML Renderer</strong> — Renders HTML output visually in an iframe.</div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Template Syntax */}
          <section>
            <h3 className="font-semibold text-base mb-2">Template Syntax</h3>
            <div className="rounded-md border bg-muted/50 p-3 space-y-1.5 text-muted-foreground font-mono text-xs">
              <p><code className="text-foreground">{'{{input}}'}</code> <span className="font-sans">— incoming data from connected nodes</span></p>
              <p><code className="text-foreground">{'{{variable}}'}</code> <span className="font-sans">— custom parameter value</span></p>
              <p><code className="text-foreground">{'{{result.name}}'}</code> <span className="font-sans">— dot notation for nested access</span></p>
            </div>
            <p className="text-muted-foreground mt-2">
              When multiple nodes connect into one, data is merged into an object keyed by source node ID.
            </p>
          </section>

          <Separator />

          {/* Building Flows */}
          <section>
            <h3 className="font-semibold text-base mb-2">Building Flows</h3>
            <p className="text-muted-foreground">
              Drag nodes from the toolbar onto the canvas. Connect nodes by dragging from an
              output handle (<span className="inline-block w-2 h-2 rounded-full bg-primary align-middle mx-0.5" />)
              to an input handle. Arrange them into a chain or branching tree.
            </p>
          </section>

          <Separator />

          {/* Input Sets */}
          <section>
            <h3 className="font-semibold text-base mb-2">Creating Input Sets</h3>
            <p className="text-muted-foreground mb-2">
              In the <strong>Test</strong> tab, click <InlineIcon icon={Plus} /> <strong>New</strong> to create an input set.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>Simple mode</strong> — enter one input per line. Good for quick tests with a single parameter.
              </p>
              <p>
                <strong>Structured mode</strong> — define named fields and fill in a spreadsheet-style table.
                Each row becomes an object like <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{"query": "...", "style": "..."}'}</code>.
              </p>
              <p>
                You can also click <InlineIcon icon={Upload} /> to import from a <code className="bg-muted px-1 py-0.5 rounded text-xs">.csv</code> or{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">.txt</code> file. CSV headers automatically become fields in structured mode.
              </p>
            </div>
          </section>

          <Separator />

          {/* Running Batch Tests */}
          <section>
            <h3 className="font-semibold text-base mb-2">Running Batch Tests</h3>
            <p className="text-muted-foreground mb-2">
              In the <strong>Test</strong> tab, use the <strong>Run Batch</strong> card:
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <StepNumber n={1} />
                Give the batch a name.
              </p>
              <p>
                <StepNumber n={2} />
                Select an input set from the dropdown.
              </p>
              <p>
                <StepNumber n={3} />
                Check one or more flows to test against. Selecting multiple flows lets you compare the same inputs across different prompt configurations.
              </p>
              <p>
                <StepNumber n={4} />
                Click <InlineIcon icon={Play} className="text-green-500" /> <strong>Run Batch</strong>. Runs execute 3 at a time with a live progress bar.
                Click <InlineIcon icon={Square} className="text-red-500" /> <strong>Abort</strong> to cancel remaining runs.
              </p>
            </div>
            <p className="text-muted-foreground mt-2 text-xs italic">
              Total runs = number of flows × number of inputs in the set.
            </p>
          </section>

          <Separator />

          {/* Rating Results */}
          <section>
            <h3 className="font-semibold text-base mb-2">Rating Results</h3>
            <p className="text-muted-foreground mb-2">
              In the <strong>Results</strong> tab <ArrowRight className="inline h-3 w-3 mx-0.5" /> <strong>Batch Detail</strong>,
              select a completed batch and click <InlineIcon icon={Star} className="text-yellow-500" /> <strong>Rate Results</strong>.
            </p>
            <p className="text-muted-foreground mb-2">
              A full-screen overlay lets you step through each run and rate it on 5 dimensions (1–5 scale):
            </p>
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              {['Usability', 'Responsive', 'Design', 'Quality', 'Accuracy'].map((d) => (
                <div key={d} className="rounded border bg-muted/50 py-1.5 font-medium">{d}</div>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`inline-flex items-center justify-center h-6 w-6 rounded border text-xs font-mono ${n === 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {n}
                </span>
              ))}
              <span className="ml-2">← click to score each dimension</span>
            </div>
            <p className="text-muted-foreground mt-2">
              Add optional notes per run. Navigate with <InlineIcon icon={ChevronLeft} /><InlineIcon icon={ChevronRight} /> buttons
              or <Kbd>←</Kbd> <Kbd>→</Kbd> arrow keys. Ratings auto-save as you go.
            </p>
          </section>

          <Separator />

          {/* Comparing Results */}
          <section>
            <h3 className="font-semibold text-base mb-2">Comparing Results</h3>
            <p className="text-muted-foreground mb-2">
              In the <strong>Results</strong> tab <ArrowRight className="inline h-3 w-3 mx-0.5" /> <strong>Compare</strong>,
              select one or more completed batches to visualize side-by-side.
            </p>
            <p className="text-muted-foreground mb-2">
              Three visualization modes:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              <div className="rounded-md border p-2">
                <BarChart3 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="font-medium text-foreground">Bar Chart</div>
                <div>Grouped bars per dimension</div>
              </div>
              <div className="rounded-md border p-2">
                <Radar className="h-5 w-5 mx-auto mb-1 text-violet-500" />
                <div className="font-medium text-foreground">Radar</div>
                <div>Overlapping polygons</div>
              </div>
              <div className="rounded-md border p-2">
                <Table className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="font-medium text-foreground">Table</div>
                <div>Exact averages + overall</div>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Each batch + flow combination becomes a series. This lets you compare different prompt
              strategies, model settings, or flow structures across the same test inputs.
            </p>
          </section>

          <Separator />

          {/* Versions */}
          <section>
            <h3 className="font-semibold text-base mb-2">Versions</h3>
            <p className="text-muted-foreground">
              Save and restore flow snapshots from the <strong>Versions</strong> panel in the right sidebar.
              This lets you experiment with changes while keeping previous states available to roll back to.
            </p>
          </section>

          <Separator />

          {/* Changelog */}
          <section>
            <h3 className="font-semibold text-base mb-2">Changelog</h3>
            <div className="space-y-4 text-muted-foreground">

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.7.0 — 2026-02-05</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Real-time streaming in run drawer — live text, tool calls, and blinking cursor</li>
                  <li>Streaming status card with spinner, elapsed timer, and auto-scroll</li>
                  <li>Per-node and total run cost tracking (input/output token split)</li>
                  <li>Token breakdown tooltip on node result badges</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.6.2 — 2026-02-05</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Duplicate flow button — copies nodes, edges, VFS files, and saved versions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.6.1 — 2026-02-05</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Rethemed VFS example flow as &quot;Educational Game Builder&quot; with classifier/router branching</li>
                  <li>Generate path: Planner (Haiku) + Generator (Opus) builds games with VFS tools</li>
                  <li>Edit path: Editor (Opus) makes surgical edits to existing game files</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.6.0 — 2026-02-05</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Agentic tool-call loop for agent nodes with VFS tools (view, edit, create_file, list_files)</li>
                  <li>Virtual filesystem shared across tool-enabled nodes within a run</li>
                  <li>Tool call trace display in node results</li>
                  <li>VFS snapshot viewer in node results and run detail</li>
                  <li>&quot;Files&quot; tab in sidebar with VFS editor for seeding initial files</li>
                  <li>&quot;Enable Tools&quot; toggle and &quot;Max Tool Iterations&quot; config on agent nodes</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.5.0 — 2026-02-02</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Dark mode support</li>
                  <li>Split view layout for right sidebar</li>
                  <li>Instructions / how-to modal</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.4.0 — 2026-02-01</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Flow versioning system</li>
                  <li>Parameterized user inputs</li>
                  <li>Batch execution support</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.3.0 — 2026-01-30</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>HTML renderer node output</li>
                  <li>Streaming responses from LLM calls</li>
                  <li>Increased token limit for completions</li>
                  <li>Example flows and Opus model support</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.2.0 — 2026-01-29</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>OpenAI and Anthropic provider integrations</li>
                  <li>Multi-provider LLM architecture</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">v0.1.0 — 2026-01-29</h4>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Initial project scaffold (Next.js 14 App Router)</li>
                  <li>ReactFlow canvas with node-based flow builder</li>
                  <li>Core node types: user-input, agent, structured-output, router, output</li>
                  <li>Flow execution engine with sequential processing</li>
                  <li>IndexedDB persistence via Zustand stores</li>
                </ul>
              </div>

            </div>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  );
}
