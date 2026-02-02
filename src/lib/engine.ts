import type { Flow, FlowNode, NodeResult, RoutingRule } from './types';
import { callLLMStream } from './llm/provider';

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
  onResult: (result: NodeResult) => void
): Promise<string | null> {
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
        return next[0] ?? null;
      }

      case 'agent': {
        const humanMessage = interpolateTemplate(node.data.humanMessageTemplate || '', input);
        const systemPrompt = node.data.systemPrompt || 'You are a helpful assistant.';

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
        return next[0] ?? null;
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
        return next[0] ?? null;
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
        return targetNodeId;
      }

      case 'html-renderer': {
        // Pass-through node: extract HTML from input and forward it
        let htmlContent: unknown = input;
        if (typeof input === 'object' && input !== null && 'html' in input) {
          htmlContent = (input as Record<string, unknown>).html;
        }
        const htmlResult: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input,
          output: htmlContent,
          latencyMs: Date.now() - start,
        };
        results.set(node.id, htmlResult);
        onResult(htmlResult);
        const nextHtml = getAdjacentNodes(flow, node.id);
        return nextHtml[0] ?? null;
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
        return null; // terminal
      }

      default:
        return null;
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

export async function executeFlow(
  flow: Flow,
  userInput: string | Record<string, string>,
  onNodeResult: (result: NodeResult) => void
): Promise<{ results: NodeResult[]; finalOutput: string }> {
  const results: ResultMap = new Map();
  const startNodes = findStartNodes(flow);

  if (startNodes.length === 0) {
    throw new Error('Flow has no start nodes');
  }

  let currentNodeId: string | null = startNodes[0].id;
  let finalOutput = '';

  while (currentNodeId) {
    const node = flow.nodes.find((n) => n.id === currentNodeId);
    if (!node) throw new Error(`Node ${currentNodeId} not found`);

    const nextNodeId = await executeNode(flow, node, results, userInput, onNodeResult);

    if (node.type === 'output') {
      const result = results.get(node.id);
      finalOutput = typeof result?.output === 'string' ? result.output : JSON.stringify(result?.output);
    }

    currentNodeId = nextNodeId;
  }

  return {
    results: Array.from(results.values()),
    finalOutput,
  };
}
