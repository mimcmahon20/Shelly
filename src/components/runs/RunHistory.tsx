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

export function RunHistory() {
  const runs = useRunStore((s) => s.runs);
  const currentRunId = useRunStore((s) => s.currentRunId);
  const setCurrentRun = useRunStore((s) => s.setCurrentRun);

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No runs yet. Execute a flow to see results.</p>;
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {runs.map((run) => (
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
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(run.startedAt).toLocaleString()}
              </p>
            </button>
          ))}
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
