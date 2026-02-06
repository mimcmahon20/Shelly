import { create } from 'zustand';
import type { Run, NodeResult, VirtualFileSystem } from '@/lib/types';
import { saveRun, getRunsByFlow } from '@/lib/db';

interface RunState {
  runs: Run[];
  currentRunId: string | null;

  loadRuns: (flowId: string) => Promise<void>;
  createRun: (flowId: string, userInput: string | Record<string, string>) => Run;
  updateRun: (runId: string, updates: Partial<Run>) => void;
  addNodeResult: (runId: string, result: NodeResult) => void;
  completeRun: (runId: string, finalOutput: string, finalVfs?: VirtualFileSystem) => void;
  failRun: (runId: string, error: string) => void;
  setCurrentRun: (id: string | null) => void;
  persistRun: (runId: string) => Promise<void>;
  getCurrentRun: () => Run | undefined;
}

export const useRunStore = create<RunState>((set, get) => ({
  runs: [],
  currentRunId: null,

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
}));
