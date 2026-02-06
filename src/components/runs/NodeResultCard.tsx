'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { HtmlPreviewModal } from '@/components/shared/HtmlPreviewModal';
import type { NodeResult } from '@/lib/types';

export function NodeResultCard({ result }: { result: NodeResult }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [vfsExpanded, setVfsExpanded] = useState(false);

  const formatData = (data: unknown) => {
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  const isHtmlRenderer = result.nodeType === 'html-renderer';
  const htmlContent = isHtmlRenderer && typeof result.output === 'string' ? result.output : '';
  const hasToolCalls = result.toolCalls && result.toolCalls.length > 0;
  const hasVfsSnapshot = result.vfsSnapshot && Object.keys(result.vfsSnapshot).length > 0;

  return (
    <>
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

          {hasToolCalls && (
            <div>
              <button
                onClick={() => setToolsExpanded(!toolsExpanded)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1 hover:text-foreground transition-colors"
              >
                {toolsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {result.toolCalls!.length} tool call{result.toolCalls!.length !== 1 ? 's' : ''}
              </button>
              {toolsExpanded && (
                <div className="space-y-2">
                  {result.toolCalls!.map((trace) => (
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
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-48 whitespace-pre-wrap">
              {result.error ? result.error : formatData(result.output)}
            </pre>
          </div>

          {hasVfsSnapshot && (
            <div>
              <button
                onClick={() => setVfsExpanded(!vfsExpanded)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-3 w-3" />
                {vfsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                View Files ({Object.keys(result.vfsSnapshot!).length})
              </button>
              {vfsExpanded && (
                <div className="mt-1 space-y-1">
                  {Object.entries(result.vfsSnapshot!).map(([path, content]) => (
                    <div key={path} className="border rounded p-2">
                      <p className="text-[10px] font-mono font-medium mb-1">{path}</p>
                      <pre className="text-[10px] bg-muted p-1.5 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                        {content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isHtmlRenderer && htmlContent && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setPreviewOpen(true)}
            >
              <Globe className="h-3 w-3 mr-1" /> Preview HTML
            </Button>
          )}
        </CardContent>
      </Card>
      {isHtmlRenderer && (
        <HtmlPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          html={htmlContent}
        />
      )}
    </>
  );
}
