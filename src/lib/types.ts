export type NodeType = 'user-input' | 'agent' | 'structured-output' | 'router' | 'output' | 'html-renderer';

export type VirtualFileSystem = Record<string, string>;

export interface ToolCallTrace {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  iteration: number;
}

export interface StreamingNodeState {
  nodeId: string;
  nodeType: NodeType;
  nodeLabel?: string;
  status: 'streaming' | 'tool_loop';
  streamedText: string;
  toolCalls: ToolCallTrace[];
  startedAt: number;
}

export interface StreamCallbacks {
  onDelta: (nodeId: string, text: string) => void;
  onToolCall: (nodeId: string, trace: ToolCallTrace) => void;
  onNodeStart: (nodeId: string, nodeType: NodeType, nodeLabel?: string) => void;
}

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
  toolsEnabled?: boolean;
  maxToolIterations?: number;
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
  initialVfs?: VirtualFileSystem;
}

export interface NodeResult {
  nodeId: string;
  nodeType: NodeType;
  input: unknown;
  output: unknown;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  latencyMs?: number;
  error?: string;
  toolCalls?: ToolCallTrace[];
  vfsSnapshot?: VirtualFileSystem;
}

export interface Run {
  id: string;
  flowId: string;
  status: 'running' | 'completed' | 'failed';
  userInput: string | Record<string, string>;
  nodeResults: NodeResult[];
  finalOutput: string;
  startedAt: string;
  completedAt?: string;
  finalVfs?: VirtualFileSystem;
}

export interface LLMRequest {
  provider?: string;
  model?: string;
  systemPrompt: string;
  humanMessage: string;
  outputSchema?: string;
  toolsEnabled?: boolean;
  vfs?: VirtualFileSystem;
  maxToolIterations?: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  toolCalls?: ToolCallTrace[];
  vfs?: VirtualFileSystem;
}

// Test Suite Types
export type InputValue = string | Record<string, string>;

export const RATING_DIMENSIONS = ['usability', 'responsiveness', 'design', 'quality', 'accuracy'] as const;
export type RatingDimension = (typeof RATING_DIMENSIONS)[number];

export interface TestInputSet {
  id: string;
  name: string;
  inputMode: 'simple' | 'structured';
  fields?: string[];
  inputs: InputValue[];
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

export interface FlowVersion {
  id: string;
  flowId: string;
  label: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
}
