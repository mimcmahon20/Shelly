'use client';
import { useEffect, useState } from 'react';
import { useTestStore } from '@/stores/testStore';
import { useFlowStore } from '@/stores/flowStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Run } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { ViewportPreview } from '@/components/shared/ViewportPreview';

export function BatchResults() {
  const { batches, batchRuns, loadBatchRuns, setRatingMode, loadBatches } = useTestStore();
  const { flows } = useFlowStore();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  useEffect(() => {
    if (selectedBatch) {
      loadBatchRuns(selectedBatch.runIds);
    }
  }, [selectedBatchId, selectedBatch, loadBatchRuns]);

  const groupedByFlow = batchRuns.reduce<Record<string, Run[]>>((acc, run) => {
    if (!acc[run.flowId]) acc[run.flowId] = [];
    acc[run.flowId].push(run);
    return acc;
  }, {});

  const getFlowName = (flowId: string) => flows.find((f) => f.id === flowId)?.name ?? flowId;

  const getTotalTokens = (run: Run) =>
    run.nodeResults.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0);

  const getTotalLatency = (run: Run) =>
    run.nodeResults.reduce((sum, r) => sum + (r.latencyMs ?? 0), 0);

  const handleStartRating = () => {
    if (!selectedBatch) return;
    const completedRunIds = batchRuns.filter((r) => r.status === 'completed').map((r) => r.id);
    if (completedRunIds.length > 0) {
      setRatingMode(completedRunIds);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select batch..." />
          </SelectTrigger>
          <SelectContent>
            {batches.filter((b) => b.status !== 'running').map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name} ({b.progress.completed} runs)</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBatch && (
          <Button size="sm" onClick={handleStartRating}>
            <Star className="h-3 w-3 mr-1" /> Rate Results
          </Button>
        )}
      </div>

      {selectedBatch && Object.entries(groupedByFlow).map(([flowId, runs]) => (
        <div key={flowId} className="space-y-2">
          <h4 className="text-sm font-medium">{getFlowName(flowId)}</h4>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Input</th>
                  <th className="text-left p-2">Output</th>
                  <th className="text-right p-2">Latency</th>
                  <th className="text-right p-2">Tokens</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t">
                    <td className="p-2 max-w-32 truncate">
                      {typeof run.userInput === 'object'
                        ? Object.entries(run.userInput).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : run.userInput}
                    </td>
                    <td className="p-2 max-w-48">
                      <span
                        className="truncate block cursor-pointer hover:text-primary"
                        onClick={() => {
                          if (run.finalOutput.includes('<') && run.finalOutput.includes('>')) {
                            setPreviewHtml(run.finalOutput);
                          }
                        }}
                      >
                        {run.finalOutput.substring(0, 100)}
                      </span>
                    </td>
                    <td className="p-2 text-right">{getTotalLatency(run)}ms</td>
                    <td className="p-2 text-right">{getTotalTokens(run)}</td>
                    <td className="p-2 text-center">
                      <Badge variant={run.status === 'completed' ? 'default' : 'destructive'} className="text-[10px]">
                        {run.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {selectedBatch && Object.keys(groupedByFlow).length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">No completed runs in this batch.</p>
      )}

      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-8" onClick={() => setPreviewHtml(null)}>
          <div className="bg-background rounded-lg w-full max-w-4xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium">HTML Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(null)}>Close</Button>
            </div>
            <ViewportPreview html={previewHtml} className="flex-1 min-h-0 px-3 pb-3" />
          </div>
        </div>
      )}
    </div>
  );
}
