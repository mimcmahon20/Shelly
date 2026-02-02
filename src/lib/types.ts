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

// Test Suite Types
export const RATING_DIMENSIONS = ['usability', 'responsiveness', 'design', 'quality', 'accuracy'] as const;
export type RatingDimension = (typeof RATING_DIMENSIONS)[number];

export interface TestInputSet {
  id: string;
  name: string;
  inputs: string[];
  createdAt: string;
}

export interface TestBatch {
  id: string;
  name: string;
  inputSetId: string;
  flowIds: string[];
  runIds: string[];
  status: 'pending' | 'running' | 'completed' | 'aborted' | 'failed';
  progress: { completed: number; total: number };
  createdAt: string;
  completedAt?: string;
}

export interface RunRating {
  id: string;
  runId: string;
  batchId: string;
  ratings: Record<RatingDimension, number>;
  notes?: string;
  createdAt: string;
}
