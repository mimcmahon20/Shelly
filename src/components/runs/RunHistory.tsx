'use client';
import { useRunStore } from '@/stores/runStore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { RunDetail } from './RunDetail';
import { calculateCost, formatCost } from '@/lib/cost';
import type { Run } from '@/lib/types';

export function RunHistory() {
  const runs = useRunStore((s) => s.runs);
  const currentRunId = useRunStore((s) => s.currentRunId);
  const setCurrentRun = useRunStore((s) => s.setCurrentRun);

  const getRunStats = (run: Run) => {
    const totalMs = run.nodeResults.reduce((sum, r) => sum + (r.latencyMs || 0), 0);
    const cost = run.nodeResults.reduce((sum, r) => {
      if (r.inputTokens != null && r.outputTokens != null) {
        return sum + calculateCost(r.inputTokens, r.outputTokens, r.model);
      }
      return sum;
    }, 0);
    const seconds = (totalMs / 1000).toFixed(1);
    return { seconds, cost };
  };

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No runs yet. Execute a flow to see results.</p>;
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {runs.map((run) => {
            const { seconds, cost } = getRunStats(run);
            return (
              <button
                key={run.id}
                onClick={() => setCurrentRun(run.id)}
                className="w-full text-left rounded-md p-3 text-sm transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[180px]">{typeof run.userInput === 'object' ? Object.entries(run.userInput).map(([k, v]) => `${k}: ${v}`).join(', ') : run.userInput}</span>
                  <Badge
                    variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {run.status}
                  </Badge>
                </div>
                {run.status !== 'running' && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{seconds}s</span>
                    {cost > 0 && <span>{formatCost(cost)}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <Drawer open={!!currentRunId} onOpenChange={(open) => { if (!open) setCurrentRun(null); }}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Run Details</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 px-4 pb-6">
            <RunDetail />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
