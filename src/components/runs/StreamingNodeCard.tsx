'use client';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { StreamingNodeState } from '@/lib/types';

export function StreamingNodeCard({ state }: { state: StreamingNodeState }) {
  const [elapsed, setElapsed] = useState(0);
  const textRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - state.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.startedAt]);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [state.streamedText]);

  return (
    <Card className="mb-3 border-primary/30 bg-primary/[0.02]">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <CardTitle className="text-sm">
              {state.nodeLabel || state.nodeType}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {state.status === 'tool_loop' ? 'Using tools...' : 'Streaming...'}
            </Badge>
            <Badge variant="outline" className="text-xs">{elapsed}s</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {state.toolCalls.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {state.toolCalls.length} tool call{state.toolCalls.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {state.toolCalls.map((trace) => (
                <div key={trace.id} className="border rounded p-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{trace.toolName}</Badge>
                    <span className="text-[10px] text-muted-foreground">iteration {trace.iteration}</span>
                  </div>
                  <pre className="text-[10px] bg-muted p-1.5 rounded overflow-x-auto max-h-20 whitespace-pre-wrap">
                    {JSON.stringify(trace.input, null, 2)}
                  </pre>
                  <pre className="text-[10px] bg-muted p-1.5 rounded overflow-x-auto max-h-20 whitespace-pre-wrap">
                    {trace.output}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
          <pre
            ref={textRef}
            className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-48 whitespace-pre-wrap"
          >
            {state.streamedText || (
              <span className="text-muted-foreground italic">Waiting for response...</span>
            )}
            {state.streamedText && (
              <span className="inline-block w-1.5 h-3.5 bg-primary/70 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
