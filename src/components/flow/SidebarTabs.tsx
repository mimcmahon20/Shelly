'use client';
import { useEffect, useRef, useState } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunHistory } from '@/components/runs/RunHistory';
import { VersionPanel } from '@/components/flow/VersionPanel';
import { NodeConfigPanel } from '@/components/flow/NodeConfigPanel';
import { VfsEditor } from '@/components/flow/VfsEditor';

export function SidebarTabs() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const flow = useFlowStore((s) => s.getCurrentFlow());
  const [activeTab, setActiveTab] = useState('runs');
  const prevTabRef = useRef('runs');

  const fileCount = flow?.initialVfs ? Object.keys(flow.initialVfs).length : 0;

  useEffect(() => {
    if (selectedNodeId) {
      prevTabRef.current = activeTab !== 'node' ? activeTab : prevTabRef.current;
      setActiveTab('node');
    } else {
      setActiveTab((cur) => (cur === 'node' ? prevTabRef.current : cur));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  return (
    <div className="w-72 shrink-0 border-l flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 shrink-0">
          <TabsTrigger value="runs" className="text-xs">Runs</TabsTrigger>
          <TabsTrigger value="versions" className="text-xs">Versions</TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            Files{fileCount > 0 && ` (${fileCount})`}
          </TabsTrigger>
          {selectedNodeId && (
            <TabsTrigger value="node" className="text-xs">Node</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="runs" className="flex-1 overflow-auto mt-0">
          <RunHistory />
        </TabsContent>
        <TabsContent value="versions" className="flex-1 overflow-auto mt-0">
          <VersionPanel />
        </TabsContent>
        <TabsContent value="files" className="flex-1 overflow-auto mt-0">
          <VfsEditor />
        </TabsContent>
        {selectedNodeId && (
          <TabsContent value="node" className="flex-1 overflow-auto mt-0">
            <NodeConfigPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
