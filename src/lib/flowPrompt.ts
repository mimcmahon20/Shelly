import type { Flow, FlowNode, FlowEdge, RoutingRule } from './types';

// --- Helper functions ---

export function extractTemplateVars(template: string): string[] {
  const matches = template.match(/\{\{([\w.|-]+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(2, -2))));
}

interface TraceNode {
  node: FlowNode;
  depth: number;
  branchLabel?: string;
}

function findStartNodes(flow: Flow): FlowNode[] {
  const targetIds = new Set(flow.edges.map((e) => e.target));
  return flow.nodes.filter((n) => !targetIds.has(n.id));
}

function getOutgoingEdges(flow: Flow, nodeId: string): FlowEdge[] {
  return flow.edges.filter((e) => e.source === nodeId);
}

function getIncomingEdges(flow: Flow, nodeId: string): FlowEdge[] {
  return flow.edges.filter((e) => e.target === nodeId);
}

export function traceExecutionPaths(flow: Flow): TraceNode[] {
  const startNodes = findStartNodes(flow);
  const visited = new Set<string>();
  const result: TraceNode[] = [];

  function dfs(nodeId: string, depth: number, branchLabel?: string) {
    if (visited.has(nodeId)) {
      // Note convergence but don't revisit
      const node = flow.nodes.find((n) => n.id === nodeId);
      if (node) {
        result.push({ node, depth, branchLabel: branchLabel ? `${branchLabel} (convergence point)` : '(convergence point)' });
      }
      return;
    }
    visited.add(nodeId);

    const node = flow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    result.push({ node, depth, branchLabel });

    if (node.type === 'router') {
      // For routers, trace each rule branch and default
      const rules = node.data.routingRules || [];
      for (const rule of rules) {
        if (rule.targetNodeId) {
          const label = `${rule.field} ${rule.operator} "${rule.value}"`;
          dfs(rule.targetNodeId, depth + 1, label);
        }
      }
      if (node.data.defaultTargetNodeId) {
        dfs(node.data.defaultTargetNodeId, depth + 1, 'default');
      }
      // Also follow any edges not covered by rules
      const ruleTargets = new Set([
        ...rules.map((r) => r.targetNodeId).filter(Boolean),
        node.data.defaultTargetNodeId,
      ]);
      const otherEdges = getOutgoingEdges(flow, nodeId).filter((e) => !ruleTargets.has(e.target));
      for (const edge of otherEdges) {
        dfs(edge.target, depth + 1, edge.label || 'fallback edge');
      }
    } else {
      const outgoing = getOutgoingEdges(flow, nodeId);
      for (const edge of outgoing) {
        dfs(edge.target, depth);
      }
    }
  }

  for (const start of startNodes) {
    dfs(start.id, 0);
  }

  return result;
}

function describeRoutingRule(rule: RoutingRule, flow: Flow): string {
  const targetNode = flow.nodes.find((n) => n.id === rule.targetNodeId);
  const targetLabel = targetNode?.data.label || targetNode?.id || rule.targetNodeId;
  const opMap: Record<string, string> = {
    equals: 'equals',
    contains: 'contains',
    gt: 'is greater than',
    lt: 'is less than',
  };
  const op = opMap[rule.operator] || rule.operator;
  return `If \`${rule.field}\` ${op} \`"${rule.value}"\` → route to **${targetLabel}**`;
}

export function describeNode(node: FlowNode, flow: Flow): string {
  const lines: string[] = [];
  const label = node.data.label || node.id;
  const incoming = getIncomingEdges(flow, node.id);

  switch (node.type) {
    case 'user-input':
      lines.push(`**${label}** (\`${node.id}\`) — *User Input*`);
      lines.push(`Entry point. Passes user-provided input to downstream nodes.`);
      if (incoming.length > 0) {
        lines.push(`Receives input from: ${incoming.map((e) => `\`${e.source}\``).join(', ')}`);
      }
      break;

    case 'agent': {
      lines.push(`**${label}** (\`${node.id}\`) — *Agent (LLM Call)*`);
      if (node.data.model) lines.push(`Model: \`${node.data.model}\``);
      if (node.data.systemPrompt) {
        const sp = node.data.systemPrompt.length > 300
          ? node.data.systemPrompt.slice(0, 300) + '...'
          : node.data.systemPrompt;
        lines.push(`System prompt: "${sp}"`);
      }
      if (node.data.humanMessageTemplate) {
        lines.push(`Message template: \`${node.data.humanMessageTemplate}\``);
        const vars = extractTemplateVars(node.data.humanMessageTemplate);
        if (vars.length > 0) lines.push(`Template variables: ${vars.map((v) => `\`{{${v}}}\``).join(', ')}`);
      }
      if (node.data.toolsEnabled) {
        lines.push(`Tools enabled: Yes (VFS tools: view, edit, create_file, list_files)`);
        if (node.data.maxToolIterations) lines.push(`Max tool iterations: ${node.data.maxToolIterations}`);
      }
      break;
    }

    case 'structured-output': {
      lines.push(`**${label}** (\`${node.id}\`) — *Structured Output*`);
      if (node.data.model) lines.push(`Model: \`${node.data.model}\``);
      if (node.data.systemPrompt) {
        const sp = node.data.systemPrompt.length > 300
          ? node.data.systemPrompt.slice(0, 300) + '...'
          : node.data.systemPrompt;
        lines.push(`System prompt: "${sp}"`);
      }
      if (node.data.humanMessageTemplate) {
        lines.push(`Message template: \`${node.data.humanMessageTemplate}\``);
        const vars = extractTemplateVars(node.data.humanMessageTemplate);
        if (vars.length > 0) lines.push(`Template variables: ${vars.map((v) => `\`{{${v}}}\``).join(', ')}`);
      }
      if (node.data.outputSchema) {
        lines.push(`Output schema:`);
        lines.push('```json');
        lines.push(node.data.outputSchema);
        lines.push('```');
      }
      break;
    }

    case 'router': {
      lines.push(`**${label}** (\`${node.id}\`) — *Router (Conditional Branch)*`);
      const rules = node.data.routingRules || [];
      if (rules.length > 0) {
        lines.push(`Routing rules (evaluated sequentially, first match wins):`);
        for (const rule of rules) {
          lines.push(`- ${describeRoutingRule(rule, flow)}`);
        }
      }
      if (node.data.defaultTargetNodeId) {
        const defaultNode = flow.nodes.find((n) => n.id === node.data.defaultTargetNodeId);
        const defaultLabel = defaultNode?.data.label || node.data.defaultTargetNodeId;
        lines.push(`- Default (no rule matched) → **${defaultLabel}**`);
      }
      break;
    }

    case 'output':
      lines.push(`**${label}** (\`${node.id}\`) — *Output (Terminal)*`);
      lines.push(`Terminal node. Collects and presents the final result of this execution path.`);
      break;

    case 'html-renderer':
      lines.push(`**${label}** (\`${node.id}\`) — *HTML Renderer*`);
      lines.push(`Renders HTML output. If VFS contains an index.html file, it assembles HTML/CSS/JS from VFS files; otherwise uses upstream input as HTML content.`);
      break;
  }

  // Note multi-input convergence
  if (incoming.length > 1) {
    lines.push(`Convergence point: receives input from ${incoming.length} sources (${incoming.map((e) => `\`${e.source}\``).join(', ')}). Inputs are merged into an object keyed by source node ID.`);
  }

  return lines.join('\n');
}

// --- Static schema reference ---

function generateSchemaReference(flow: Flow): string {
  const hasVfs = !!flow.initialVfs || flow.nodes.some((n) => n.data.toolsEnabled);
  const hasRouter = flow.nodes.some((n) => n.type === 'router');
  const hasStructuredOutput = flow.nodes.some((n) => n.type === 'structured-output');
  const hasHtmlRenderer = flow.nodes.some((n) => n.type === 'html-renderer');

  let ref = `## Shelly Flow Schema Reference

### Node Types

- **user-input**: Entry point node. Captures user input and passes it downstream as-is.
- **agent**: Makes an LLM call with a system prompt and a human message template. The LLM response becomes the node's output, passed to downstream nodes.
- **structured-output**: Like agent, but constrains the LLM to return JSON matching a specified schema (implemented via the tool_use pattern).
- **router**: Conditional branching. Evaluates routing rules sequentially against the incoming data; the first matching rule determines which downstream node receives the data. If no rule matches, falls back to the default target.
- **output**: Terminal node. Marks the end of an execution path and collects the final result.`;

  if (hasHtmlRenderer) {
    ref += `\n- **html-renderer**: Renders HTML content. If VFS is active, assembles HTML/CSS/JS from virtual filesystem files (index.html, style.css, script.js). Otherwise renders upstream input as HTML.`;
  }

  ref += `

### Data Flow & Edges

Edges connect a source node's output to a target node's input. Data flows along edges from source → target.

- **Single input**: When a node has one incoming edge, it receives that source node's output directly.
- **Multi input**: When multiple edges converge on a node, the inputs are merged into an object keyed by source node ID: \`{ "source-node-id-1": output1, "source-node-id-2": output2 }\`.

### Template Interpolation

Agent and structured-output nodes use \`{{variable}}\` syntax in their message templates:
- \`{{input}}\` — refers to the incoming data
- \`{{node-id}}\` — when multi-input, accesses a specific source's output
- Dot notation supported: \`{{node-id.field.subfield}}\` for nested JSON access
- Unresolved variables are left as-is in the output

### Execution Model

1. Execution starts from nodes with no incoming edges (start/root nodes)
2. Nodes execute sequentially following the edge graph
3. Router nodes branch execution to exactly one downstream path based on rule evaluation
4. Execution terminates at output nodes or nodes with no outgoing edges`;

  if (hasVfs) {
    ref += `

### Virtual Filesystem (VFS) & Tools

Tool-enabled agent nodes can read and modify files in a virtual filesystem (VFS). The VFS is a flat key-value store: file paths → file contents.

Available tools:
- **view**: Read a file's contents (with optional line range)
- **edit**: Replace text in a file (find-and-replace)
- **create_file**: Create or overwrite a file
- **list_files**: List all files in the VFS

VFS state is shared across all tool-enabled nodes during execution — mutations from one agent are visible to downstream agents. The initial VFS state is defined at the flow level (\`initialVfs\`).`;
  }

  if (hasStructuredOutput) {
    ref += `

### Structured Output

Structured output nodes enforce a JSON schema on the LLM response. The schema is provided via the tool_use pattern: the LLM is given a tool with the output schema as its input schema and instructed to "call" that tool, ensuring the response conforms to the schema. The parsed JSON becomes the node's output.`;
  }

  if (hasRouter) {
    ref += `

### Router Rules

Router nodes evaluate rules sequentially against the incoming data (parsed as JSON if it's a string):
- **equals**: Case-insensitive string equality
- **contains**: Case-insensitive substring match
- **gt**: Numeric greater-than comparison
- **lt**: Numeric less-than comparison

Field access uses dot notation (e.g., \`result.category\`). The first matching rule wins. If no rule matches, the default target is used.`;
  }

  return ref;
}

// --- Main export ---

export function generateFlowPrompt(flow: Flow): string {
  const sections: string[] = [];

  // Section A: Header
  const hasVfs = !!flow.initialVfs || flow.nodes.some((n) => n.data.toolsEnabled);
  const hasRouter = flow.nodes.some((n) => n.type === 'router');
  const hasStructuredOutput = flow.nodes.some((n) => n.type === 'structured-output');

  const features: string[] = [];
  if (hasVfs) features.push('VFS/Tools');
  if (hasRouter) features.push('Routing');
  if (hasStructuredOutput) features.push('Structured Output');

  let header = `# Shelly Flow: ${flow.name}

- **Nodes**: ${flow.nodes.length}
- **Edges**: ${flow.edges.length}`;
  if (features.length > 0) header += `\n- **Features**: ${features.join(', ')}`;

  header += `

This document describes a Shelly flow — a visual LLM prompt chain. It includes a schema reference explaining the format, a walkthrough of this specific flow's execution, and the full flow JSON for import or reimplementation.`;

  sections.push(header);

  // Section B: Schema Reference
  sections.push(generateSchemaReference(flow));

  // Section C: Flow-Specific Analysis
  const trace = traceExecutionPaths(flow);
  let analysis = `## Flow Analysis: ${flow.name}\n`;

  if (flow.initialVfs) {
    const vfsPaths = Object.keys(flow.initialVfs).sort();
    analysis += `\n### Initial VFS Files\n\n${vfsPaths.map((p) => `- \`${p}\``).join('\n')}\n`;
  }

  analysis += `\n### Execution Walkthrough\n`;

  for (const { node, depth, branchLabel } of trace) {
    const indent = '  '.repeat(depth);
    if (branchLabel) {
      analysis += `\n${indent}**Branch: ${branchLabel}**\n\n`;
    }
    const desc = describeNode(node, flow);
    // Indent each line of the description for branch depth
    const indentedDesc = desc.split('\n').map((line) => indent + line).join('\n');
    analysis += `\n${indentedDesc}\n`;
  }

  sections.push(analysis);

  // Section D: Flow JSON
  let jsonSection = `## Flow JSON\n`;
  if (flow.initialVfs) {
    const vfsPaths = Object.keys(flow.initialVfs).sort();
    jsonSection += `\nVFS files included: ${vfsPaths.map((p) => `\`${p}\``).join(', ')}\n`;
  }
  jsonSection += `\n\`\`\`json\n${JSON.stringify(flow, null, 2)}\n\`\`\``;

  sections.push(jsonSection);

  return sections.join('\n\n---\n\n');
}
