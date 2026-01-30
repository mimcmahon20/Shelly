'use client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NodeResult } from '@/lib/types';

export function NodeResultCard({ result }: { result: NodeResult }) {
  const formatData = (data: unknown) => {
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  return (
    <Card className="mb-3">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{result.nodeType}</CardTitle>
          <div className="flex gap-2">
            {result.latencyMs !== undefined && (
              <Badge variant="outline" className="text-xs">{result.latencyMs}ms</Badge>
            )}
            {result.tokensUsed !== undefined && (
              <Badge variant="outline" className="text-xs">{result.tokensUsed} tokens</Badge>
            )}
            {result.error && <Badge variant="destructive" className="text-xs">Error</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32 whitespace-pre-wrap">
            {formatData(result.input)}
          </pre>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-48 whitespace-pre-wrap">
            {result.error ? result.error : formatData(result.output)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
