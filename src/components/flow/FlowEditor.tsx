'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useRunStore } from '@/stores/runStore';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { NodeToolbar } from '@/components/flow/NodeToolbar';
import { SidebarTabs } from '@/components/flow/SidebarTabs';
import { useVersionStore } from '@/stores/versionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { executeFlow } from '@/lib/engine';
import { Play, Braces } from 'lucide-react';
import type { Flow } from '@/lib/types';

function extractTemplateVariables(flow: Flow): string[] {
  const vars = new Set<string>();
  for (const node of flow.nodes) {
    const templates = [node.data.humanMessageTemplate, node.data.systemPrompt].filter(Boolean);
    for (const t of templates) {
      let m: RegExpExecArray | null;
      const re = /\{\{([\w]+)\}\}/g;
      while ((m = re.exec(t!)) !== null) {
        if (m[1] !== 'input') vars.add(m[1]);
      }
    }
  }
  return Array.from(vars);
}

export function FlowEditor() {
  const {
    currentFlowId,
    persistCurrentFlow,
    getCurrentFlow,
    flows,
  } = useFlowStore();

  const { loadRuns, createRun, addNodeResult, completeRun, failRun, persistRun } = useRunStore();
  const { loadVersions } = useVersionStore();

  const [userInput, setUserInput] = useState('');
  const [structuredInput, setStructuredInput] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [useStructured, setUseStructured] = useState(false);

  const flow = getCurrentFlow();
  const templateVars = useMemo(() => (flow ? extractTemplateVariables(flow) : []), [flow]);
  const hasVars = templateVars.length > 0;

  useEffect(() => {
    if (currentFlowId) {
      loadRuns(currentFlowId);
      loadVersions(currentFlowId);
    }
  }, [currentFlowId, loadRuns, loadVersions]);

  useEffect(() => {
    if (currentFlowId) {
      const timeout = setTimeout(() => persistCurrentFlow(), 500);
      return () => clearTimeout(timeout);
    }
  }, [currentFlowId, flows, persistCurrentFlow]);

  // Reset structured input when template vars change
  useEffect(() => {
    const obj: Record<string, string> = {};
    for (const v of templateVars) obj[v] = '';
    setStructuredInput(obj);
  }, [templateVars]);

  const canRun = useStructured
    ? templateVars.some((v) => structuredInput[v]?.trim())
    : !!userInput.trim();

  const handleRunFlow = useCallback(async () => {
    if (!flow || !canRun) return;

    setIsRunning(true);
    const input = useStructured ? { ...structuredInput } : userInput.trim();
    const run = createRun(flow.id, input);

    try {
      const { finalOutput } = await executeFlow(flow, input, (result) => {
        addNodeResult(run.id, result);
      });
      completeRun(run.id, finalOutput);
    } catch (error) {
      failRun(run.id, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
      await persistRun(run.id);
    }
  }, [flow, canRun, useStructured, structuredInput, userInput, createRun, addNodeResult, completeRun, failRun, persistRun]);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      <div className="flex-1 flex flex-col">
        {currentFlowId && <NodeToolbar />}

        {currentFlowId && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
            {useStructured ? (
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                {templateVars.map((v) => (
                  <div key={v} className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">{v}</label>
                    <Input
                      value={structuredInput[v] ?? ''}
                      onChange={(e) => setStructuredInput((prev) => ({ ...prev, [v]: e.target.value }))}
                      placeholder={v}
                      className="w-36"
                      onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleRunFlow()}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter user input to run the flow..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleRunFlow()}
              />
            )}
            {hasVars && (
              <Button
                variant={useStructured ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setUseStructured(!useStructured)}
                title="Toggle structured input"
              >
                <Braces className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleRunFlow} disabled={isRunning || !canRun}>
              <Play className="h-4 w-4 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        )}

        <div className="flex-1">
          <FlowCanvas />
        </div>
      </div>

      {currentFlowId && <SidebarTabs />}
    </div>
  );
}
