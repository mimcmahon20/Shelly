'use client';
import { useState, useEffect } from 'react';
import { useTestStore } from '@/stores/testStore';
import { useFlowStore } from '@/stores/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square } from 'lucide-react';

export function BatchRunner() {
  const { inputSets, batches, runBatch, abortBatch, abortController } = useTestStore();
  const { flows, loadFlows } = useFlowStore();

  const [batchName, setBatchName] = useState('');
  const [selectedInputSetId, setSelectedInputSetId] = useState('');
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>([]);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const isRunning = abortController !== null;
  const runningBatch = batches.find((b) => b.status === 'running');

  const toggleFlow = (flowId: string) => {
    setSelectedFlowIds((prev) =>
      prev.includes(flowId) ? prev.filter((id) => id !== flowId) : [...prev, flowId]
    );
  };

  const handleRun = async () => {
    if (!batchName.trim() || !selectedInputSetId || selectedFlowIds.length === 0) return;
    await runBatch(batchName.trim(), selectedInputSetId, selectedFlowIds, flows);
    setBatchName('');
    setSelectedFlowIds([]);
    setSelectedInputSetId('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Run Batch</h3>

      {isRunning && runningBatch ? (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{runningBatch.name}</span>
            <Button variant="destructive" size="sm" onClick={abortBatch}>
              <Square className="h-3 w-3 mr-1" /> Abort
            </Button>
          </div>
          <Progress value={runningBatch.progress.completed} max={runningBatch.progress.total} />
          <p className="text-xs text-muted-foreground">
            {runningBatch.progress.completed} / {runningBatch.progress.total} runs completed
          </p>
        </Card>
      ) : (
        <Card className="p-4 space-y-3">
          <Input
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="Batch name..."
          />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Input Set</label>
            <Select value={selectedInputSetId} onValueChange={setSelectedInputSetId}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select input set..." />
              </SelectTrigger>
              <SelectContent>
                {inputSets.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.inputs.length} inputs)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Flows</label>
            <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
              {flows.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFlowIds.includes(f.id)}
                    onChange={() => toggleFlow(f.id)}
                    className="rounded"
                  />
                  {f.name}
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!batchName.trim() || !selectedInputSetId || selectedFlowIds.length === 0}
            onClick={handleRun}
          >
            <Play className="h-3 w-3 mr-1" /> Run Batch
          </Button>
        </Card>
      )}
    </div>
  );
}
