'use client';
import { useState, useEffect } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { generateFlowPrompt } from '@/lib/flowPrompt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PanelLeftOpen,
  PanelLeftClose,
  Plus,
  Upload,
  Copy,
  Trash2,
  Download,
  ChevronDown,
  FileCode,
  FileText,
  Clipboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'shelly-sidebar-collapsed';

export function FlowSidebar() {
  const {
    flows,
    currentFlowId,
    setCurrentFlow,
    createFlow,
    deleteFlow,
    duplicateFlow,
    getCurrentFlow,
    loadFlows,
  } = useFlowStore();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [clipboardCopied, setClipboardCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    await createFlow(newFlowName.trim());
    setNewFlowName('');
    setCreateDialogOpen(false);
  };

  const handleExportFlow = () => {
    const flow = getCurrentFlow();
    if (!flow) return;
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flow.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        imported.id = crypto.randomUUID();
        imported.createdAt = new Date().toISOString();
        imported.updatedAt = new Date().toISOString();
        const { saveFlow } = await import('@/lib/db');
        await saveFlow(imported);
        await loadFlows();
        setCurrentFlow(imported.id);
      } catch {
        alert('Invalid flow JSON file');
      }
    };
    input.click();
  };

  const handleExportGuide = () => {
    const flow = getCurrentFlow();
    if (!flow) return;
    const markdown = generateFlowPrompt(flow);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flow.name}_guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async () => {
    const flow = getCurrentFlow();
    if (!flow) return;
    const markdown = generateFlowPrompt(flow);
    await navigator.clipboard.writeText(markdown);
    setClipboardCopied(true);
    setTimeout(() => setClipboardCopied(false), 2000);
  };

  return (
    <>
      <div
        className={cn(
          'flex flex-col border-r bg-card transition-[width] duration-200 overflow-hidden shrink-0',
          collapsed ? 'w-12' : 'w-64'
        )}
      >
        {/* Toggle button */}
        <div className="flex items-center h-10 px-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          {!collapsed && (
            <span className="ml-2 text-sm font-medium text-muted-foreground">Flows</span>
          )}
        </div>

        {!collapsed && (
          <>
            <Separator />

            {/* Flow list */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {flows.map((flow) => (
                  <button
                    key={flow.id}
                    onClick={() => setCurrentFlow(flow.id)}
                    className={cn(
                      'w-full text-left text-sm px-3 py-1.5 rounded-md truncate transition-colors',
                      flow.id === currentFlowId
                        ? 'bg-accent font-medium'
                        : 'hover:bg-accent/50 text-muted-foreground'
                    )}
                  >
                    {flow.name}
                  </button>
                ))}
                {flows.length === 0 && (
                  <p className="text-xs text-muted-foreground px-3 py-2">No flows yet</p>
                )}
              </div>
            </ScrollArea>

            {/* Selected flow actions */}
            {currentFlowId && (
              <>
                <Separator />
                <div className="p-2 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => duplicateFlow(currentFlowId)}
                  >
                    <Copy className="h-3 w-3 mr-2" /> Duplicate
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-7"
                      >
                        <Download className="h-3 w-3 mr-2" /> Export{' '}
                        <ChevronDown className="h-3 w-3 ml-auto" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem onClick={handleExportFlow}>
                        <FileCode className="h-4 w-4 mr-2" /> Export Flow (JSON)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportGuide}>
                        <FileText className="h-4 w-4 mr-2" /> Export with Guide
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyPrompt}>
                        <Clipboard className="h-4 w-4 mr-2" />{' '}
                        {clipboardCopied ? 'Copied!' : 'Copy Implementation Prompt'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7 text-destructive hover:text-destructive"
                    onClick={() => deleteFlow(currentFlowId)}
                  >
                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                  </Button>
                </div>
              </>
            )}

            {/* Footer actions */}
            <Separator />
            <div className="p-2 space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-7"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-2" /> New Flow
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-7"
                onClick={handleImportFlow}
              >
                <Upload className="h-3 w-3 mr-2" /> Import
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Create dialog rendered outside sidebar to avoid overflow clipping */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Flow</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Input
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              placeholder="Flow name..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFlow()}
            />
            <Button onClick={handleCreateFlow}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
