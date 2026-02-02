import { create } from 'zustand';
import type { TestInputSet, TestBatch, RunRating, Run, Flow } from '@/lib/types';
import {
  saveInputSet, getAllInputSets, deleteInputSet,
  saveTestBatch, getAllTestBatches,
  saveRunRating, getRatingsByBatch, getRatingByRun,
  saveRun,
} from '@/lib/db';
import { executeFlow } from '@/lib/engine';

interface TestState {
  inputSets: TestInputSet[];
  batches: TestBatch[];
  ratings: RunRating[];
  batchRuns: Run[];

  // Rating mode
  ratingRunIds: string[];
  ratingIndex: number;

  // Abort controller
  abortController: AbortController | null;

  loadInputSets: () => Promise<void>;
  createInputSet: (name: string, inputs: string[]) => Promise<TestInputSet>;
  removeInputSet: (id: string) => Promise<void>;

  loadBatches: () => Promise<void>;
  runBatch: (name: string, inputSetId: string, flowIds: string[], flows: Flow[]) => Promise<void>;
  abortBatch: () => void;

  loadRatingsForBatch: (batchId: string) => Promise<void>;
  loadRatingsForBatches: (batchIds: string[]) => Promise<void>;
  saveRating: (rating: RunRating) => Promise<void>;
  getRatingForRun: (runId: string) => Promise<RunRating | undefined>;

  setRatingMode: (runIds: string[], startIndex?: number) => void;
  setRatingIndex: (index: number) => void;
  exitRatingMode: () => void;

  loadBatchRuns: (runIds: string[]) => Promise<void>;
}

export const useTestStore = create<TestState>((set, get) => ({
  inputSets: [],
  batches: [],
  ratings: [],
  batchRuns: [],
  ratingRunIds: [],
  ratingIndex: 0,
  abortController: null,

  loadInputSets: async () => {
    const inputSets = await getAllInputSets();
    set({ inputSets });
  },

  createInputSet: async (name, inputs) => {
    const inputSet: TestInputSet = {
      id: crypto.randomUUID(),
      name,
      inputs,
      createdAt: new Date().toISOString(),
    };
    await saveInputSet(inputSet);
    set((s) => ({ inputSets: [...s.inputSets, inputSet] }));
    return inputSet;
  },

  removeInputSet: async (id) => {
    await deleteInputSet(id);
    set((s) => ({ inputSets: s.inputSets.filter((i) => i.id !== id) }));
  },

  loadBatches: async () => {
    const batches = await getAllTestBatches();
    set({ batches: batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  },

  runBatch: async (name, inputSetId, flowIds, flows) => {
    const inputSet = get().inputSets.find((s) => s.id === inputSetId);
    if (!inputSet) return;

    const controller = new AbortController();
    const total = inputSet.inputs.length * flowIds.length;

    const batch: TestBatch = {
      id: crypto.randomUUID(),
      name,
      inputSetId,
      flowIds,
      runIds: [],
      status: 'running',
      progress: { completed: 0, total },
      createdAt: new Date().toISOString(),
    };

    set((s) => ({ batches: [batch, ...s.batches], abortController: controller }));
    await saveTestBatch(batch);

    const tasks: Array<{ flow: Flow; input: string }> = [];
    for (const flowId of flowIds) {
      const flow = flows.find((f) => f.id === flowId);
      if (!flow) continue;
      for (const input of inputSet.inputs) {
        tasks.push({ flow, input });
      }
    }

    let completed = 0;
    const runIds: string[] = [];

    // Concurrency pool of 3
    const pool = async (taskList: typeof tasks) => {
      const executing = new Set<Promise<void>>();
      for (const task of taskList) {
        if (controller.signal.aborted) break;

        const p = (async () => {
          const run: Run = {
            id: crypto.randomUUID(),
            flowId: task.flow.id,
            status: 'running',
            userInput: task.input,
            nodeResults: [],
            finalOutput: '',
            startedAt: new Date().toISOString(),
          };
          runIds.push(run.id);

          try {
            const { finalOutput, results } = await executeFlow(
              task.flow,
              task.input,
              () => {}
            );
            run.status = 'completed';
            run.finalOutput = finalOutput;
            run.nodeResults = results;
            run.completedAt = new Date().toISOString();
          } catch (error) {
            run.status = 'failed';
            run.finalOutput = error instanceof Error ? error.message : 'Unknown error';
            run.completedAt = new Date().toISOString();
          }

          await saveRun(run);
          completed++;
          set((s) => ({
            batches: s.batches.map((b) =>
              b.id === batch.id
                ? { ...b, runIds: [...runIds], progress: { completed, total } }
                : b
            ),
          }));
        })();

        executing.add(p);
        p.finally(() => executing.delete(p));
        if (executing.size >= 3) {
          await Promise.race(executing);
        }
      }
      await Promise.all(executing);
    };

    try {
      await pool(tasks);
      const finalStatus = controller.signal.aborted ? 'aborted' : 'completed';
      const finalBatch: TestBatch = {
        ...batch,
        runIds,
        status: finalStatus,
        progress: { completed, total },
        completedAt: new Date().toISOString(),
      };
      set((s) => ({
        batches: s.batches.map((b) => (b.id === batch.id ? finalBatch : b)),
        abortController: null,
      }));
      await saveTestBatch(finalBatch);
    } catch {
      const failedBatch: TestBatch = {
        ...batch,
        runIds,
        status: 'failed',
        progress: { completed, total },
        completedAt: new Date().toISOString(),
      };
      set((s) => ({
        batches: s.batches.map((b) => (b.id === batch.id ? failedBatch : b)),
        abortController: null,
      }));
      await saveTestBatch(failedBatch);
    }
  },

  abortBatch: () => {
    const controller = get().abortController;
    if (controller) controller.abort();
  },

  loadRatingsForBatch: async (batchId) => {
    const ratings = await getRatingsByBatch(batchId);
    set({ ratings });
  },

  loadRatingsForBatches: async (batchIds) => {
    const all: RunRating[] = [];
    for (const id of batchIds) {
      const r = await getRatingsByBatch(id);
      all.push(...r);
    }
    set({ ratings: all });
  },

  saveRating: async (rating) => {
    await saveRunRating(rating);
    set((s) => {
      const existing = s.ratings.findIndex((r) => r.id === rating.id);
      if (existing >= 0) {
        const updated = [...s.ratings];
        updated[existing] = rating;
        return { ratings: updated };
      }
      return { ratings: [...s.ratings, rating] };
    });
  },

  getRatingForRun: async (runId) => {
    return getRatingByRun(runId);
  },

  setRatingMode: (runIds, startIndex = 0) => {
    set({ ratingRunIds: runIds, ratingIndex: startIndex });
  },

  setRatingIndex: (index) => set({ ratingIndex: index }),

  exitRatingMode: () => set({ ratingRunIds: [], ratingIndex: 0 }),

  loadBatchRuns: async (runIds) => {
    const { getRun } = await import('@/lib/db');
    const runs: Run[] = [];
    for (const id of runIds) {
      const run = await getRun(id);
      if (run) runs.push(run);
    }
    set({ batchRuns: runs });
  },
}));
