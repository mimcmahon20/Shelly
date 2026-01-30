'use client';
import { useRunStore } from '@/stores/runStore';
import { NodeResultCard } from './NodeResultCard';
import { Badge } from '@/components/ui/badge';

export function RunDetail() {
  const run = useRunStore((s) => s.getCurrentRun());

  if (!run) return null;

  const totalTokens = run.nodeResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
  const totalLatency = run.nodeResults.reduce((sum, r) => sum + (r.latencyMs || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
          {run.status}
        </Badge>
        <Badge variant="outline">{totalTokens} total tokens</Badge>
        <Badge variant="outline">{totalLatency}ms total</Badge>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">User Input</p>
        <pre className="text-sm bg-muted p-2 rounded-md whitespace-pre-wrap">{run.userInput}</pre>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Node Results ({run.nodeResults.length})</p>
        {run.nodeResults.map((result, i) => (
          <NodeResultCard key={`${result.nodeId}-${i}`} result={result} />
        ))}
      </div>

      {run.finalOutput && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Final Output</p>
          <pre className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
            {run.finalOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
