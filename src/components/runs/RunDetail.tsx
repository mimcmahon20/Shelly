'use client';
import { useState } from 'react';
import { useRunStore } from '@/stores/runStore';
import { NodeResultCard } from './NodeResultCard';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function RunDetail() {
  const run = useRunStore((s) => s.getCurrentRun());
  const [vfsExpanded, setVfsExpanded] = useState(false);

  if (!run) return null;

  const totalTokens = run.nodeResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
  const totalLatency = run.nodeResults.reduce((sum, r) => sum + (r.latencyMs || 0), 0);
  const hasFinalVfs = run.finalVfs && Object.keys(run.finalVfs).length > 0;

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
        <pre className="text-sm bg-muted p-2 rounded-md whitespace-pre-wrap">{typeof run.userInput === 'object' ? Object.entries(run.userInput).map(([k, v]) => `${k}: ${v}`).join(', ') : run.userInput}</pre>
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

      {hasFinalVfs && (
        <div>
          <button
            onClick={() => setVfsExpanded(!vfsExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1 hover:text-foreground transition-colors"
          >
            {vfsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Final Files ({Object.keys(run.finalVfs!).length})
          </button>
          {vfsExpanded && (
            <div className="space-y-2">
              {Object.entries(run.finalVfs!).map(([path, content]) => (
                <div key={path} className="border rounded p-2">
                  <p className="text-xs font-mono font-medium mb-1">{path}</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
