'use client';
import { useEffect, useState } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { FlowEditor } from '@/components/flow/FlowEditor';
import { TestTab } from '@/components/test/TestTab';
import { ResultsTab } from '@/components/results/ResultsTab';

import { ApiKeyInput } from '@/components/settings/ApiKeyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Trash2, Download, Upload, RotateCcw, X, HelpCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HowToModal } from '@/components/HowToModal';
import { resetDatabase } from '@/lib/db';

export default function Home() {
  const {
    flows,
    currentFlowId,
    loadFlows,
    createFlow,
    setCurrentFlow,
    deleteFlow,
    getCurrentFlow,
  } = useFlowStore();

  const [newFlowName, setNewFlowName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

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

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg">Shelly</h1>
          <Separator orientation="vertical" className="h-6" />

          {/* Flow selector */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <div className="flex items-center gap-2">
              <Select value={currentFlowId || ''} onValueChange={(v) => setCurrentFlow(v || null)}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="Select a flow..." />
                </SelectTrigger>
                <SelectContent>
                  {flows.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentFlowId && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentFlow(null)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3 mr-1" /> New
                </Button>
              </DialogTrigger>
              {currentFlowId && (
                <Button variant="ghost" size="sm" onClick={() => deleteFlow(currentFlowId)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
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
        </div>

        <div className="flex items-center gap-2">
          {currentFlowId && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportFlow}>
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportFlow}>
                <Upload className="h-3 w-3 mr-1" /> Import
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setHowToOpen(true)}>
            <HelpCircle className="h-3 w-3" />
          </Button>
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-3 w-3 mr-1" /> Settings
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-6">
                <ApiKeyInput />
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Reset</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Delete all flows and runs, then restore the example flow.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      if (!confirm('This will delete all flows and run history. Continue?')) return;
                      await resetDatabase();
                      await loadFlows();
                      setCurrentFlow('example-designer-builder');
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset to Example
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content with tabs */}
      <Tabs defaultValue="build" className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="px-4 pt-2 border-b">
          <TabsList>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="build" className="flex-1 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
          <FlowEditor />
        </TabsContent>

        <TabsContent value="test" className="flex-1 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
          <TestTab />
        </TabsContent>

        <TabsContent value="results" className="flex-1 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
          <ResultsTab />
        </TabsContent>
      </Tabs>
      <HowToModal open={howToOpen} onOpenChange={setHowToOpen} />
    </div>
  );
}
