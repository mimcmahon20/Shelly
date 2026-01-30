import { create } from 'zustand';
import type { Flow, FlowNode, FlowEdge } from '@/lib/types';
import { saveFlow, getAllFlows, deleteFlow as dbDeleteFlow, getFlow } from '@/lib/db';

function generateId() {
  return crypto.randomUUID();
}

interface FlowState {
  flows: Flow[];
  currentFlowId: string | null;
  selectedNodeId: string | null;

  loadFlows: () => Promise<void>;
  createFlow: (name: string) => Promise<Flow>;
  loadFlow: (id: string) => Promise<void>;
  deleteFlow: (id: string) => Promise<void>;
  setCurrentFlow: (id: string | null) => void;
  selectNode: (id: string | null) => void;

  // Node/edge mutations on current flow
  addNode: (type: FlowNode['type'], position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<FlowNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  addEdge: (edge: Omit<FlowEdge, 'id'>) => void;
  removeEdge: (edgeId: string) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  persistCurrentFlow: () => Promise<void>;

  getCurrentFlow: () => Flow | undefined;
}

const defaultLabels: Record<FlowNode['type'], string> = {
  'user-input': 'User Input',
  'agent': 'Agent',
  'structured-output': 'Structured Output',
  'router': 'Router',
  'output': 'Output',
};

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  currentFlowId: null,
  selectedNodeId: null,

  loadFlows: async () => {
    const flows = await getAllFlows();
    set({ flows });
  },

  createFlow: async (name: string) => {
    const flow: Flow = {
      id: generateId(),
      name,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveFlow(flow);
    set((s) => ({ flows: [...s.flows, flow], currentFlowId: flow.id }));
    return flow;
  },

  loadFlow: async (id: string) => {
    const flow = await getFlow(id);
    if (flow) {
      set((s) => ({
        currentFlowId: id,
        flows: s.flows.map((f) => (f.id === id ? flow : f)),
      }));
    }
  },

  deleteFlow: async (id: string) => {
    await dbDeleteFlow(id);
    set((s) => ({
      flows: s.flows.filter((f) => f.id !== id),
      currentFlowId: s.currentFlowId === id ? null : s.currentFlowId,
    }));
  },

  setCurrentFlow: (id) => set({ currentFlowId: id, selectedNodeId: null }),
  selectNode: (id) => set({ selectedNodeId: id }),

  addNode: (type, position) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;

    const node: FlowNode = {
      id: generateId(),
      type,
      position,
      data: { label: defaultLabels[type] },
    };

    const updated = { ...flow, nodes: [...flow.nodes, node], updatedAt: new Date().toISOString() };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  updateNode: (nodeId, data) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;

    const updated = {
      ...flow,
      nodes: flow.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  removeNode: (nodeId) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;

    const updated = {
      ...flow,
      nodes: flow.nodes.filter((n) => n.id !== nodeId),
      edges: flow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  updateNodePosition: (nodeId, position) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;

    const updated = {
      ...flow,
      nodes: flow.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  addEdge: (edge) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;

    const newEdge: FlowEdge = { ...edge, id: generateId() };
    const updated = { ...flow, edges: [...flow.edges, newEdge], updatedAt: new Date().toISOString() };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  removeEdge: (edgeId) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;

    const updated = {
      ...flow,
      edges: flow.edges.filter((e) => e.id !== edgeId),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  setNodes: (nodes) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;
    const updated = { ...flow, nodes, updatedAt: new Date().toISOString() };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  setEdges: (edges) => {
    const state = get();
    const flow = state.flows.find((f) => f.id === state.currentFlowId);
    if (!flow) return;
    const updated = { ...flow, edges, updatedAt: new Date().toISOString() };
    set((s) => ({ flows: s.flows.map((f) => (f.id === updated.id ? updated : f)) }));
  },

  persistCurrentFlow: async () => {
    const flow = get().getCurrentFlow();
    if (flow) await saveFlow(flow);
  },

  getCurrentFlow: () => {
    const state = get();
    return state.flows.find((f) => f.id === state.currentFlowId);
  },
}));
