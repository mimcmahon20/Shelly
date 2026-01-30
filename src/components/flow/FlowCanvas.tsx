'use client';
import { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge as rfAddEdge,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '@/stores/flowStore';
import { UserInputNode } from './nodes/UserInputNode';
import { AgentNode } from './nodes/AgentNode';
import { StructuredOutputNode } from './nodes/StructuredOutputNode';
import { RouterNode } from './nodes/RouterNode';
import { OutputNode } from './nodes/OutputNode';
import { HtmlRendererNode } from './nodes/HtmlRendererNode';
import type { FlowNode, FlowEdge, NodeType } from '@/lib/types';

const nodeTypes = {
  'user-input': UserInputNode,
  'agent': AgentNode,
  'structured-output': StructuredOutputNode,
  'router': RouterNode,
  'output': OutputNode,
  'html-renderer': HtmlRendererNode,
};

function toRFNodes(nodes: FlowNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }));
}

function toRFEdges(edges: FlowEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.label,
    animated: true,
    style: { stroke: '#6366f1' },
  }));
}

function toFlowNodes(nodes: Node[]): FlowNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type as NodeType,
    position: n.position,
    data: n.data,
  }));
}

function toFlowEdges(edges: Edge[]): FlowEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  }));
}

export function FlowCanvas() {
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const selectNode = useFlowStore((s) => s.selectNode);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // React Flow manages its own local state; we sync to/from Zustand
  const [rfNodes, setRFNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRFEdges, onEdgesChange] = useEdgesState([]);
  const syncingRef = useRef(false);

  // Sync FROM Zustand -> React Flow when flow changes (load/switch)
  useEffect(() => {
    const state = useFlowStore.getState();
    const flow = state.flows.find((f) => f.id === currentFlowId);
    if (flow) {
      syncingRef.current = true;
      setRFNodes(toRFNodes(flow.nodes));
      setRFEdges(toRFEdges(flow.edges));
      // Allow sync flag to clear after React processes the state update
      requestAnimationFrame(() => { syncingRef.current = false; });
    } else {
      setRFNodes([]);
      setRFEdges([]);
    }
  }, [currentFlowId, setRFNodes, setRFEdges]);

  // Sync FROM Zustand -> React Flow when store nodes/edges change
  // (e.g. from addNode, removeNode, config panel updates)
  useEffect(() => {
    const unsub = useFlowStore.subscribe((state, prev) => {
      const flow = state.flows.find((f) => f.id === state.currentFlowId);
      const prevFlow = prev.flows.find((f) => f.id === prev.currentFlowId);
      if (!flow) return;
      // Only sync if the change came from the store (not from React Flow dragging)
      if (flow.nodes !== prevFlow?.nodes && !syncingRef.current) {
        setRFNodes(toRFNodes(flow.nodes));
      }
      if (flow.edges !== prevFlow?.edges && !syncingRef.current) {
        setRFEdges(toRFEdges(flow.edges));
      }
    });
    return unsub;
  }, [setRFNodes, setRFEdges]);

  // Sync TO Zustand when React Flow nodes/edges change (drag, delete, etc.)
  // Use a debounced write to avoid loops
  const writebackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(rfNodes);
  const edgesRef = useRef(rfEdges);
  nodesRef.current = rfNodes;
  edgesRef.current = rfEdges;

  useEffect(() => {
    if (syncingRef.current) return;
    if (writebackTimer.current) clearTimeout(writebackTimer.current);
    writebackTimer.current = setTimeout(() => {
      const state = useFlowStore.getState();
      const flow = state.flows.find((f) => f.id === state.currentFlowId);
      if (!flow) return;
      syncingRef.current = true;
      state.setNodes(toFlowNodes(nodesRef.current));
      state.setEdges(toFlowEdges(edgesRef.current));
      requestAnimationFrame(() => { syncingRef.current = false; });
    }, 100);
    return () => { if (writebackTimer.current) clearTimeout(writebackTimer.current); };
  }, [rfNodes, rfEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setRFEdges((eds) => rfAddEdge({ ...connection, animated: true, style: { stroke: '#6366f1' } }, eds));
    },
    [setRFEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaultLabels: Record<string, string> = {
        'user-input': 'User Input',
        'agent': 'Agent',
        'structured-output': 'Structured Output',
        'router': 'Router',
        'output': 'Output',
        'html-renderer': 'HTML Renderer',
      };

      const newNode: Node = {
        id: crypto.randomUUID(),
        type,
        position,
        data: { label: defaultLabels[type] || type },
      };

      setRFNodes((nds) => [...nds, newNode]);
    },
    [setRFNodes]
  );

  if (!currentFlowId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select or create a flow to get started
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onInit={(instance) => {
        reactFlowInstance.current = instance;
      }}
      nodeTypes={nodeTypes}
      fitView
      className="bg-background"
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}
