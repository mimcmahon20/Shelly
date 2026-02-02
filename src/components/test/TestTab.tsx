'use client';
import { useEffect } from 'react';
import { useTestStore } from '@/stores/testStore';
import { InputSetManager } from './InputSetManager';
import { BatchRunner } from './BatchRunner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TestTab() {
  const { batches, loadBatches } = useTestStore();

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <InputSetManager />
        <BatchRunner />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Recent Batches</h3>
          {batches.map((b) => (
            <Card key={b.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.flowIds.length} flows &middot; {b.progress.completed}/{b.progress.total} runs
                  </div>
                </div>
                <Badge variant={
                  b.status === 'completed' ? 'default' :
                  b.status === 'running' ? 'secondary' :
                  b.status === 'aborted' ? 'outline' : 'destructive'
                }>
                  {b.status}
                </Badge>
              </div>
            </Card>
          ))}
          {batches.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No batches yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
