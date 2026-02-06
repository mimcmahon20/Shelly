import { create } from 'zustand';
import type { Run, NodeResult, VirtualFileSystem, StreamingNodeState, NodeType, ToolCallTrace } from '@/lib/types';
import { saveRun, getRunsByFlow } from '@/lib/db';

interface RunState {
  runs: Run[];
  currentRunId: string | null;
  streamingNode: StreamingNodeState | null;

  loadRuns: (flowId: string) => Promise<void>;
  createRun: (flowId: string, userInput: string | Record<string, string>) => Run;
  updateRun: (runId: string, updates: Partial<Run>) => void;
  addNodeResult: (runId: string, result: NodeResult) => void;
  completeRun: (runId: string, finalOutput: string, finalVfs?: VirtualFileSystem) => void;
  failRun: (runId: string, error: string) => void;
  setCurrentRun: (id: string | null) => void;
  persistRun: (runId: string) => Promise<void>;
  getCurrentRun: () => Run | undefined;
  setStreamingNode: (nodeId: string, nodeType: NodeType, nodeLabel?: string) => void;
  appendStreamDelta: (nodeId: string, text: string) => void;
  addStreamingToolCall: (nodeId: string, trace: ToolCallTrace) => void;
  clearStreamingNode: () => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  runs: [],
  currentRunId: null,
  streamingNode: null,

  loadRuns: async (flowId: string) => {
    const runs = await getRunsByFlow(flowId);
    set({ runs: runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
  },

  createRun: (flowId, userInput) => {
    const run: Run = {
      id: crypto.randomUUID(),
      flowId,
      status: 'running',
      userInput,
      nodeResults: [],
      finalOutput: '',
      startedAt: new Date().toISOString(),
    };
    set((s) => ({ runs: [run, ...s.runs], currentRunId: run.id }));
    return run;
  },

  updateRun: (runId, updates) => {
    set((s) => ({
      runs: s.runs.map((r) => (r.id === runId ? { ...r, ...updates } : r)),
    }));
  },

  addNodeResult: (runId, result) => {
    set((s) => ({
      runs: s.runs.map((r) =>
        r.id === runId ? { ...r, nodeResults: [...r.nodeResults, result] } : r
      ),
    }));
  },

  completeRun: (runId, finalOutput, finalVfs?) => {
    set((s) => ({
      runs: s.runs.map((r) =>
        r.id === runId
          ? { ...r, status: 'completed' as const, finalOutput, finalVfs, completedAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  failRun: (runId, error) => {
    set((s) => ({
      runs: s.runs.map((r) =>
        r.id === runId
          ? { ...r, status: 'failed' as const, finalOutput: error, completedAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  setCurrentRun: (id) => set({ currentRunId: id }),

  persistRun: async (runId) => {
    const run = get().runs.find((r) => r.id === runId);
    if (run) await saveRun(run);
  },

  getCurrentRun: () => {
    const state = get();
    return state.runs.find((r) => r.id === state.currentRunId);
  },

  setStreamingNode: (nodeId, nodeType, nodeLabel) => {
    set({
      streamingNode: {
        nodeId,
        nodeType,
        nodeLabel,
        status: 'streaming',
        streamedText: '',
        toolCalls: [],
        startedAt: Date.now(),
      },
    });
  },

  appendStreamDelta: (nodeId, text) => {
    set((s) => {
      if (!s.streamingNode || s.streamingNode.nodeId !== nodeId) return s;
      return {
        streamingNode: {
          ...s.streamingNode,
          streamedText: s.streamingNode.streamedText + text,
        },
      };
    });
  },

  addStreamingToolCall: (nodeId, trace) => {
    set((s) => {
      if (!s.streamingNode || s.streamingNode.nodeId !== nodeId) return s;
      return {
        streamingNode: {
          ...s.streamingNode,
          status: 'tool_loop',
          toolCalls: [...s.streamingNode.toolCalls, trace],
        },
      };
    });
  },

  clearStreamingNode: () => {
    set({ streamingNode: null });
  },
}));
