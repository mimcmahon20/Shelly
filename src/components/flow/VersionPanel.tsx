'use client';
import { useState } from 'react';
import { useVersionStore } from '@/stores/versionStore';
import { useFlowStore } from '@/stores/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, RotateCcw, Trash2 } from 'lucide-react';

export function VersionPanel() {
  const { versions, createVersion, deleteVersion, restoreVersion } = useVersionStore();
  const flow = useFlowStore((s) => {
    const f = s.flows.find((f) => f.id === s.currentFlowId);
    return f;
  });

  const [label, setLabel] = useState('');

  const handleSave = async () => {
    if (!flow || !label.trim()) return;
    await createVersion(flow.id, label.trim(), flow.nodes, flow.edges, flow.initialVfs);
    setLabel('');
  };

  const handleRestore = (versionId: string) => {
    if (!confirm('Restore this version? Current unsaved changes will be overwritten.')) return;
    restoreVersion(versionId);
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex gap-1.5">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Version name..."
          className="text-xs h-8"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={handleSave} disabled={!label.trim()}>
          <Save className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
      {versions.length === 0 && (
        <p className="text-xs text-muted-foreground">No saved versions yet.</p>
      )}
      <div className="flex flex-col gap-1">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-xs">
            <div className="min-w-0">
              <div className="font-medium truncate">{v.label}</div>
              <div className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRestore(v.id)} title="Restore">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteVersion(v.id)} title="Delete">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
