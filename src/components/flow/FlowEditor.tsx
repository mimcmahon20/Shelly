'use client';
import { useEffect, useState, useCallback } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useRunStore } from '@/stores/runStore';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { NodeToolbar } from '@/components/flow/NodeToolbar';
import { NodeConfigPanel } from '@/components/flow/NodeConfigPanel';
import { RunHistory } from '@/components/runs/RunHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { executeFlow } from '@/lib/engine';
import { Play, FolderOpen } from 'lucide-react';

export function FlowEditor() {
  const {
    currentFlowId,
    selectedNodeId,
    persistCurrentFlow,
    getCurrentFlow,
    flows,
  } = useFlowStore();

  const { loadRuns, createRun, addNodeResult, completeRun, failRun, persistRun } = useRunStore();

  const [userInput, setUserInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (currentFlowId) {
      loadRuns(currentFlowId);
    }
  }, [currentFlowId, loadRuns]);

  useEffect(() => {
    if (currentFlowId) {
      const timeout = setTimeout(() => persistCurrentFlow(), 500);
      return () => clearTimeout(timeout);
    }
  }, [currentFlowId, flows, persistCurrentFlow]);

  const handleRunFlow = useCallback(async () => {
    const flow = getCurrentFlow();
    if (!flow || !userInput.trim()) return;

    setIsRunning(true);
    const run = createRun(flow.id, userInput.trim());

    try {
      const { finalOutput } = await executeFlow(flow, userInput.trim(), (result) => {
        addNodeResult(run.id, result);
      });
      completeRun(run.id, finalOutput);
    } catch (error) {
      failRun(run.id, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
      await persistRun(run.id);
    }
  }, [getCurrentFlow, userInput, createRun, addNodeResult, completeRun, failRun, persistRun]);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      <div className="flex-1 flex flex-col">
        {currentFlowId && <NodeToolbar />}

        {currentFlowId && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter user input to run the flow..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleRunFlow()}
            />
            <Button onClick={handleRunFlow} disabled={isRunning || !userInput.trim()}>
              <Play className="h-4 w-4 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        )}

        <div className="flex-1">
          <FlowCanvas />
        </div>
      </div>

      {currentFlowId && (
        <>
          {selectedNodeId ? (
            <NodeConfigPanel />
          ) : (
            <div className="w-80 border-l flex flex-col">
              <div className="px-3 py-2 border-b">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" /> Run History
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <RunHistory />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
