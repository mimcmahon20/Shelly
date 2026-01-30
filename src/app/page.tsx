'use client';
import { useEffect, useState, useCallback } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useRunStore } from '@/stores/runStore';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { NodeToolbar } from '@/components/flow/NodeToolbar';
import { NodeConfigPanel } from '@/components/flow/NodeConfigPanel';
import { RunHistory } from '@/components/runs/RunHistory';

import { ApiKeyInput } from '@/components/settings/ApiKeyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { executeFlow } from '@/lib/engine';
import { Play, Plus, Settings, FolderOpen, Trash2, Download, Upload, RotateCcw } from 'lucide-react';
import { resetDatabase } from '@/lib/db';

export default function Home() {
  const {
    flows,
    currentFlowId,
    selectedNodeId,
    loadFlows,
    createFlow,
    setCurrentFlow,
    deleteFlow,
    persistCurrentFlow,
    getCurrentFlow,
  } = useFlowStore();

  const { loadRuns, createRun, addNodeResult, completeRun, failRun, persistRun } = useRunStore();

  const [newFlowName, setNewFlowName] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  useEffect(() => {
    if (currentFlowId) {
      loadRuns(currentFlowId);
    }
  }, [currentFlowId, loadRuns]);

  // Auto-save on changes
  useEffect(() => {
    if (currentFlowId) {
      const timeout = setTimeout(() => persistCurrentFlow(), 500);
      return () => clearTimeout(timeout);
    }
  }, [currentFlowId, flows, persistCurrentFlow]);

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    await createFlow(newFlowName.trim());
    setNewFlowName('');
    setCreateDialogOpen(false);
  };

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

  const handleExportFlow = () => {
    const flow = getCurrentFlow();
    if (!flow) return;
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flow.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        imported.id = crypto.randomUUID();
        imported.createdAt = new Date().toISOString();
        imported.updatedAt = new Date().toISOString();
        const { saveFlow } = await import('@/lib/db');
        await saveFlow(imported);
        await loadFlows();
        setCurrentFlow(imported.id);
      } catch {
        alert('Invalid flow JSON file');
      }
    };
    input.click();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg">Shelly</h1>
          <Separator orientation="vertical" className="h-6" />

          {/* Flow selector */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <div className="flex items-center gap-2">
              <select
                className="text-sm border rounded px-2 py-1 bg-background"
                value={currentFlowId || ''}
                onChange={(e) => setCurrentFlow(e.target.value || null)}
              >
                <option value="">Select a flow...</option>
                {flows.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3 mr-1" /> New
                </Button>
              </DialogTrigger>
              {currentFlowId && (
                <Button variant="ghost" size="sm" onClick={() => deleteFlow(currentFlowId)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Flow</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="Flow name..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFlow()}
                />
                <Button onClick={handleCreateFlow}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          {currentFlowId && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportFlow}>
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportFlow}>
                <Upload className="h-3 w-3 mr-1" /> Import
              </Button>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-3 w-3 mr-1" /> Settings
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-6">
                <ApiKeyInput />
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Reset</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Delete all flows and runs, then restore the example flow.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      if (!confirm('This will delete all flows and run history. Continue?')) return;
                      await resetDatabase();
                      await loadFlows();
                      setCurrentFlow('example-designer-builder');
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset to Example
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Flow editor area */}
        <div className="flex-1 flex flex-col">
          {currentFlowId && <NodeToolbar />}

          {/* Execute bar */}
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

        {/* Right panel */}
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
    </div>
  );
}
