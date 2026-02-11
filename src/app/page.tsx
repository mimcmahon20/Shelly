'use client';
import { useEffect, useState } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { FlowEditor } from '@/components/flow/FlowEditor';
import { FlowSidebar } from '@/components/flow/FlowSidebar';
import { TestTab } from '@/components/test/TestTab';
import { ResultsTab } from '@/components/results/ResultsTab';

import { ApiKeyInput } from '@/components/settings/ApiKeyInput';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Settings, RotateCcw, HelpCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HowToModal } from '@/components/HowToModal';
import { resetDatabase } from '@/lib/db';

export default function Home() {
  const { loadFlows, setCurrentFlow } = useFlowStore();

  const [howToOpen, setHowToOpen] = useState(false);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <h1 className="font-bold text-lg">Shelly</h1>

        <div className="flex items-center gap-2">
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

      {/* Sidebar + main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <FlowSidebar />

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
      </div>

      <HowToModal open={howToOpen} onOpenChange={setHowToOpen} />
    </div>
  );
}
