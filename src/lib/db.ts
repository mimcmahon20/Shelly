import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Flow, Run, TestInputSet, TestBatch, RunRating, FlowVersion } from './types';
import { EXAMPLE_FLOW, EXAMPLE_VFS_FLOW, EXAMPLE_DIFFICULTY_FLOW } from './exampleFlow';

interface ShellyDB extends DBSchema {
  flows: {
    key: string;
    value: Flow;
    indexes: { 'by-updated': string };
  };
  runs: {
    key: string;
    value: Run;
    indexes: { 'by-flow': string; 'by-started': string };
  };
  inputSets: {
    key: string;
    value: TestInputSet;
    indexes: { 'by-created': string };
  };
  testBatches: {
    key: string;
    value: TestBatch;
    indexes: { 'by-created': string };
  };
  runRatings: {
    key: string;
    value: RunRating;
    indexes: { 'by-run': string; 'by-batch': string };
  };
  flowVersions: {
    key: string;
    value: FlowVersion;
    indexes: { 'by-flow': string };
  };
}

let dbPromise: Promise<IDBPDatabase<ShellyDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ShellyDB>('shelly', 5, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const flowStore = db.createObjectStore('flows', { keyPath: 'id' });
          flowStore.createIndex('by-updated', 'updatedAt');

          const runStore = db.createObjectStore('runs', { keyPath: 'id' });
          runStore.createIndex('by-flow', 'flowId');
          runStore.createIndex('by-started', 'startedAt');

          flowStore.put(EXAMPLE_FLOW);
        }
        if (oldVersion < 2) {
          const inputSetStore = db.createObjectStore('inputSets', { keyPath: 'id' });
          inputSetStore.createIndex('by-created', 'createdAt');

          const batchStore = db.createObjectStore('testBatches', { keyPath: 'id' });
          batchStore.createIndex('by-created', 'createdAt');

          const ratingStore = db.createObjectStore('runRatings', { keyPath: 'id' });
          ratingStore.createIndex('by-run', 'runId');
          ratingStore.createIndex('by-batch', 'batchId');
        }
        if (oldVersion < 3) {
          const versionStore = db.createObjectStore('flowVersions', { keyPath: 'id' });
          versionStore.createIndex('by-flow', 'flowId');
        }
        if (oldVersion < 4) {
          transaction.objectStore('flows').put(EXAMPLE_VFS_FLOW);
        }
        if (oldVersion < 5) {
          transaction.objectStore('flows').put(EXAMPLE_DIFFICULTY_FLOW);
        }
      },
    });
  }
  return dbPromise;
}

// Flows
export async function saveFlow(flow: Flow) {
  const db = await getDB();
  await db.put('flows', flow);
}

export async function getFlow(id: string) {
  const db = await getDB();
  return db.get('flows', id);
}

export async function getAllFlows(): Promise<Flow[]> {
  const db = await getDB();
  return db.getAllFromIndex('flows', 'by-updated');
}

export async function deleteFlow(id: string) {
  const db = await getDB();
  await db.delete('flows', id);
}

// Runs
export async function saveRun(run: Run) {
  const db = await getDB();
  await db.put('runs', run);
}

export async function getRun(id: string) {
  const db = await getDB();
  return db.get('runs', id);
}

export async function getRunsByFlow(flowId: string): Promise<Run[]> {
  const db = await getDB();
  return db.getAllFromIndex('runs', 'by-flow', flowId);
}

export async function deleteRun(id: string) {
  const db = await getDB();
  await db.delete('runs', id);
}

// Input Sets
export async function saveInputSet(inputSet: TestInputSet) {
  const db = await getDB();
  await db.put('inputSets', inputSet);
}

export async function getInputSet(id: string) {
  const db = await getDB();
  return db.get('inputSets', id);
}

export async function getAllInputSets(): Promise<TestInputSet[]> {
  const db = await getDB();
  return db.getAllFromIndex('inputSets', 'by-created');
}

export async function deleteInputSet(id: string) {
  const db = await getDB();
  await db.delete('inputSets', id);
}

// Test Batches
export async function saveTestBatch(batch: TestBatch) {
  const db = await getDB();
  await db.put('testBatches', batch);
}

export async function getTestBatch(id: string) {
  const db = await getDB();
  return db.get('testBatches', id);
}

export async function getAllTestBatches(): Promise<TestBatch[]> {
  const db = await getDB();
  return db.getAllFromIndex('testBatches', 'by-created');
}

export async function deleteTestBatch(id: string) {
  const db = await getDB();
  await db.delete('testBatches', id);
}

// Run Ratings
export async function saveRunRating(rating: RunRating) {
  const db = await getDB();
  await db.put('runRatings', rating);
}

export async function getRatingsByBatch(batchId: string): Promise<RunRating[]> {
  const db = await getDB();
  return db.getAllFromIndex('runRatings', 'by-batch', batchId);
}

export async function getRatingByRun(runId: string): Promise<RunRating | undefined> {
  const db = await getDB();
  const ratings = await db.getAllFromIndex('runRatings', 'by-run', runId);
  return ratings[0];
}

// Flow Versions
export async function saveFlowVersion(version: FlowVersion) {
  const db = await getDB();
  await db.put('flowVersions', version);
}

export async function getFlowVersionsByFlow(flowId: string): Promise<FlowVersion[]> {
  const db = await getDB();
  return db.getAllFromIndex('flowVersions', 'by-flow', flowId);
}

export async function deleteFlowVersion(id: string) {
  const db = await getDB();
  await db.delete('flowVersions', id);
}

export async function resetDatabase() {
  const db = await getDB();
  await db.clear('flows');
  await db.clear('runs');
  await db.clear('inputSets');
  await db.clear('testBatches');
  await db.clear('runRatings');
  await db.clear('flowVersions');
  await db.put('flows', EXAMPLE_FLOW);
  await db.put('flows', EXAMPLE_VFS_FLOW);
  await db.put('flows', EXAMPLE_DIFFICULTY_FLOW);
}
