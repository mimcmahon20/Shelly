import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Flow, Run } from './types';
import { EXAMPLE_FLOW } from './exampleFlow';

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
}

let dbPromise: Promise<IDBPDatabase<ShellyDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ShellyDB>('shelly', 1, {
      upgrade(db) {
        const flowStore = db.createObjectStore('flows', { keyPath: 'id' });
        flowStore.createIndex('by-updated', 'updatedAt');

        const runStore = db.createObjectStore('runs', { keyPath: 'id' });
        runStore.createIndex('by-flow', 'flowId');
        runStore.createIndex('by-started', 'startedAt');

        // Seed the example flow
        flowStore.put(EXAMPLE_FLOW);
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

export async function resetDatabase() {
  const db = await getDB();
  await db.clear('flows');
  await db.clear('runs');
  await db.put('flows', EXAMPLE_FLOW);
}
