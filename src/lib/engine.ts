import type { Flow, FlowNode, NodeResult, RoutingRule, VirtualFileSystem } from './types';
import { callLLMStream, callLLMWithTools } from './llm/provider';

type ResultMap = Map<string, NodeResult>;

function getAdjacentNodes(flow: Flow, nodeId: string): string[] {
  return flow.edges.filter((e) => e.source === nodeId).map((e) => e.target);
}

function findStartNodes(flow: Flow): FlowNode[] {
  const targetIds = new Set(flow.edges.map((e) => e.target));
  return flow.nodes.filter((n) => !targetIds.has(n.id));
}

function getIncomingData(flow: Flow, nodeId: string, results: ResultMap): unknown {
  const incomingEdges = flow.edges.filter((e) => e.target === nodeId);
  if (incomingEdges.length === 0) return undefined;
  if (incomingEdges.length === 1) {
    const r = results.get(incomingEdges[0].source);
    return r?.output;
  }
  // Multiple inputs: merge
  const merged: Record<string, unknown> = {};
  for (const edge of incomingEdges) {
    const r = results.get(edge.source);
    if (r) merged[edge.source] = r.output;
  }
  return merged;
}

function interpolateTemplate(template: string, data: unknown): string {
  if (!template) return typeof data === 'string' ? data : JSON.stringify(data);
  return template.replace(/\{\{([\w.|-]+)\}\}/g, (_, key: string) => {
    // Support dot notation for nested access (e.g. {{result.field}})
    if (typeof data === 'object' && data !== null) {
      const parts = key.split('.');
      let current: unknown = data;
      for (const part of parts) {
        if (typeof current === 'object' && current !== null && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined) {
        return typeof current === 'string' ? current : JSON.stringify(current);
      }
    }
    if (key === 'input') return typeof data === 'string' ? data : JSON.stringify(data);
    return `{{${key}}}`;
  });
}

function assembleHtmlFromVfs(vfs: VirtualFileSystem): string | null {
  // Find the HTML file
  const htmlKey = Object.keys(vfs).find((k) => k === 'index.html') ??
    Object.keys(vfs).find((k) => k.endsWith('.html'));
  if (!htmlKey) return null;

  let html = vfs[htmlKey];
  const cssContent = vfs['style.css'] ?? vfs['styles.css'];
  const jsContent = vfs['script.js'] ?? vfs['main.js'];

  // Inline CSS: replace <link> referencing style.css/styles.css with <style> block
  if (cssContent) {
    const linkRe = /<link\s+[^>]*href=["'](?:\.\/)?styles?\.css["'][^>]*\/?>/gi;
    if (linkRe.test(html)) {
      html = html.replace(linkRe, `<style>\n${cssContent}\n</style>`);
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
    }
  }

  // Inline JS: replace <script src="script.js/main.js"> with inline <script>
  if (jsContent) {
    const scriptRe = /<script\s+[^>]*src=["'](?:\.\/)?(?:script|main)\.js["'][^>]*>\s*<\/script>/gi;
    if (scriptRe.test(html)) {
      html = html.replace(scriptRe, `<script>\n${jsContent}\n</script>`);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`);
    }
  }

  return html;
}

function evaluateRule(rule: RoutingRule, data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  let fieldValue: unknown;
  try {
    fieldValue = rule.field.split('.').reduce<unknown>((o, k) => {
      if (typeof o === 'object' && o !== null) return (o as Record<string, unknown>)[k];
      return undefined;
    }, obj);
  } catch {
    return false;
  }

  const strField = String(fieldValue ?? '');
  const strValue = rule.value;

  switch (rule.operator) {
    case 'equals':
      return strField.toLowerCase() === strValue.toLowerCase();
    case 'contains':
      return strField.toLowerCase().includes(strValue.toLowerCase());
    case 'gt':
      return Number(strField) > Number(strValue);
    case 'lt':
      return Number(strField) < Number(strValue);
    default:
      return false;
  }
}

async function executeNode(
  flow: Flow,
  node: FlowNode,
  results: ResultMap,
  userInput: string | Record<string, string>,
  onResult: (result: NodeResult) => void,
  vfs?: VirtualFileSystem
): Promise<{ nextNodeId: string | null; vfs?: VirtualFileSystem }> {
  const input = getIncomingData(flow, node.id, results) ?? userInput;
  const start = Date.now();

  try {
    switch (node.type) {
      case 'user-input': {
        const result: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input: userInput,
          output: userInput,
          latencyMs: Date.now() - start,
        };
        results.set(node.id, result);
        onResult(result);
        const next = getAdjacentNodes(flow, node.id);
        return { nextNodeId: next[0] ?? null, vfs };
      }

      case 'agent': {
        const humanMessage = interpolateTemplate(node.data.humanMessageTemplate || '', input);
        const systemPrompt = node.data.systemPrompt || 'You are a helpful assistant.';

        if (node.data.toolsEnabled && vfs) {
          const llmResult = await callLLMWithTools({
            provider: node.data.provider,
            model: node.data.model,
            systemPrompt,
            humanMessage,
            toolsEnabled: true,
            vfs: { ...vfs },
            maxToolIterations: node.data.maxToolIterations || 10,
          });

          // Update shared VFS with mutations
          const updatedVfs = llmResult.vfs ? { ...llmResult.vfs } : vfs;

          const result: NodeResult = {
            nodeId: node.id,
            nodeType: node.type,
            input: humanMessage,
            output: llmResult.content,
            tokensUsed: llmResult.tokensUsed,
            latencyMs: Date.now() - start,
            toolCalls: llmResult.toolCalls,
            vfsSnapshot: llmResult.vfs,
          };
          results.set(node.id, result);
          onResult(result);
          const next = getAdjacentNodes(flow, node.id);
          return { nextNodeId: next[0] ?? null, vfs: updatedVfs };
        }

        const llmResult = await callLLMStream({
          provider: node.data.provider,
          model: node.data.model,
          systemPrompt,
          humanMessage,
        });

        const result: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input: humanMessage,
          output: llmResult.content,
          tokensUsed: llmResult.tokensUsed,
          latencyMs: Date.now() - start,
        };
        results.set(node.id, result);
        onResult(result);
        const next = getAdjacentNodes(flow, node.id);
        return { nextNodeId: next[0] ?? null, vfs };
      }

      case 'structured-output': {
        const humanMessage = interpolateTemplate(node.data.humanMessageTemplate || '', input);
        const systemPrompt = node.data.systemPrompt || 'You are a helpful assistant. Return structured data.';

        const llmResult = await callLLMStream({
          provider: node.data.provider,
          model: node.data.model,
          systemPrompt,
          humanMessage,
          outputSchema: node.data.outputSchema,
        });

        let parsed: unknown;
        try {
          parsed = JSON.parse(llmResult.content);
        } catch {
          parsed = llmResult.content;
        }

        const result: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input: humanMessage,
          output: parsed,
          tokensUsed: llmResult.tokensUsed,
          latencyMs: Date.now() - start,
        };
        results.set(node.id, result);
        onResult(result);
        const next = getAdjacentNodes(flow, node.id);
        return { nextNodeId: next[0] ?? null, vfs };
      }

      case 'router': {
        const rules = node.data.routingRules || [];

        let parsedInput = input;
        if (typeof input === 'string') {
          try {
            parsedInput = JSON.parse(input);
          } catch {
            // keep as string
          }
        }

        let targetNodeId: string | null = null;
        for (const rule of rules) {
          if (evaluateRule(rule, parsedInput)) {
            targetNodeId = rule.targetNodeId;
            break;
          }
        }

        if (!targetNodeId && node.data.defaultTargetNodeId) {
          targetNodeId = node.data.defaultTargetNodeId;
        }

        if (!targetNodeId) {
          const next = getAdjacentNodes(flow, node.id);
          targetNodeId = next[0] ?? null;
        }

        const result: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input: parsedInput,
          output: { routedTo: targetNodeId },
          latencyMs: Date.now() - start,
        };
        results.set(node.id, result);
        onResult(result);
        return { nextNodeId: targetNodeId, vfs };
      }

      case 'html-renderer': {
        // Try assembling from VFS first, then fall back to upstream input
        let htmlContent: unknown = null;
        if (vfs) {
          const assembled = assembleHtmlFromVfs(vfs);
          if (assembled) htmlContent = assembled;
        }
        if (htmlContent === null) {
          htmlContent = input;
          if (typeof input === 'object' && input !== null && 'html' in input) {
            htmlContent = (input as Record<string, unknown>).html;
          }
        }
        const htmlResult: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input,
          output: htmlContent,
          latencyMs: Date.now() - start,
          vfsSnapshot: vfs ? { ...vfs } : undefined,
        };
        results.set(node.id, htmlResult);
        onResult(htmlResult);
        const nextHtml = getAdjacentNodes(flow, node.id);
        return { nextNodeId: nextHtml[0] ?? null, vfs };
      }

      case 'output': {
        const outputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
        const result: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input,
          output: outputStr,
          latencyMs: Date.now() - start,
        };
        results.set(node.id, result);
        onResult(result);
        return { nextNodeId: null, vfs }; // terminal
      }

      default:
        return { nextNodeId: null, vfs };
    }
  } catch (error) {
    const result: NodeResult = {
      nodeId: node.id,
      nodeType: node.type,
      input,
      output: null,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    results.set(node.id, result);
    onResult(result);
    throw error;
  }
}

function hasToolEnabledNode(flow: Flow): boolean {
  return flow.nodes.some((n) => n.data.toolsEnabled);
}

export async function executeFlow(
  flow: Flow,
  userInput: string | Record<string, string>,
  onNodeResult: (result: NodeResult) => void
): Promise<{ results: NodeResult[]; finalOutput: string; finalVfs?: VirtualFileSystem }> {
  const results: ResultMap = new Map();
  const startNodes = findStartNodes(flow);

  if (startNodes.length === 0) {
    throw new Error('Flow has no start nodes');
  }

  let currentNodeId: string | null = startNodes[0].id;
  let finalOutput = '';
  let vfs: VirtualFileSystem | undefined;

  if (flow.initialVfs || hasToolEnabledNode(flow)) {
    vfs = flow.initialVfs ? { ...flow.initialVfs } : {};
  }

  while (currentNodeId) {
    const node = flow.nodes.find((n) => n.id === currentNodeId);
    if (!node) throw new Error(`Node ${currentNodeId} not found`);

    const execResult = await executeNode(flow, node, results, userInput, onNodeResult, vfs);

    if (execResult.vfs) {
      vfs = execResult.vfs;
    }

    if (node.type === 'output') {
      const result = results.get(node.id);
      finalOutput = typeof result?.output === 'string' ? result.output : JSON.stringify(result?.output);
    }

    currentNodeId = execResult.nextNodeId;
  }

  return {
    results: Array.from(results.values()),
    finalOutput,
    finalVfs: vfs,
  };
}
