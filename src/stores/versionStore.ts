import { create } from 'zustand';
import type { FlowVersion, FlowNode, FlowEdge } from '@/lib/types';
import { saveFlowVersion, getFlowVersionsByFlow, deleteFlowVersion as dbDeleteVersion } from '@/lib/db';
import { useFlowStore } from './flowStore';

interface VersionState {
  versions: FlowVersion[];
  loadVersions: (flowId: string) => Promise<void>;
  createVersion: (flowId: string, label: string, nodes: FlowNode[], edges: FlowEdge[]) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
  restoreVersion: (versionId: string) => void;
}

export const useVersionStore = create<VersionState>((set, get) => ({
  versions: [],

  loadVersions: async (flowId: string) => {
    const versions = await getFlowVersionsByFlow(flowId);
    versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    set({ versions });
  },

  createVersion: async (flowId, label, nodes, edges) => {
    const version: FlowVersion = {
      id: crypto.randomUUID(),
      flowId,
      label,
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      createdAt: new Date().toISOString(),
    };
    await saveFlowVersion(version);
    set((s) => ({ versions: [version, ...s.versions] }));
  },

  deleteVersion: async (id) => {
    await dbDeleteVersion(id);
    set((s) => ({ versions: s.versions.filter((v) => v.id !== id) }));
  },

  restoreVersion: (versionId) => {
    const version = get().versions.find((v) => v.id === versionId);
    if (!version) return;
    const { setNodes, setEdges } = useFlowStore.getState();
    setNodes(structuredClone(version.nodes));
    setEdges(structuredClone(version.edges));
  },
}));
