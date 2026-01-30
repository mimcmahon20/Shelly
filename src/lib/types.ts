export type NodeType = 'user-input' | 'agent' | 'structured-output' | 'router' | 'output' | 'html-renderer';

export interface RoutingRule {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt';
  value: string;
  targetNodeId: string;
}

export type ProviderName = 'anthropic' | 'openai' | 'google-vertex';

export interface FlowNodeData {
  label?: string;
  provider?: ProviderName;
  model?: string;
  systemPrompt?: string;
  humanMessageTemplate?: string;
  outputSchema?: string; // JSON schema as string
  routingRules?: RoutingRule[];
  defaultTargetNodeId?: string;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Flow {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface NodeResult {
  nodeId: string;
  nodeType: NodeType;
  input: unknown;
  output: unknown;
  tokensUsed?: number;
  latencyMs?: number;
  error?: string;
}

export interface Run {
  id: string;
  flowId: string;
  status: 'running' | 'completed' | 'failed';
  userInput: string;
  nodeResults: NodeResult[];
  finalOutput: string;
  startedAt: string;
  completedAt?: string;
}

export interface LLMRequest {
  provider?: string;
  model?: string;
  systemPrompt: string;
  humanMessage: string;
  outputSchema?: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
}
