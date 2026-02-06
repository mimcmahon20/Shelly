'use client';
import { useState } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileText } from 'lucide-react';

export function VfsEditor() {
  const flow = useFlowStore((s) => s.getCurrentFlow());
  const updateFlowVfs = useFlowStore((s) => s.updateFlowVfs);
  const [newPath, setNewPath] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const vfs = flow?.initialVfs || {};
  const files = Object.entries(vfs).sort(([a], [b]) => a.localeCompare(b));

  const handleAddFile = () => {
    if (!newPath.trim()) return;
    updateFlowVfs({ ...vfs, [newPath.trim()]: newContent });
    setNewPath('');
    setNewContent('');
    setShowAddForm(false);
  };

  const handleUpdateContent = (path: string, content: string) => {
    updateFlowVfs({ ...vfs, [path]: content });
  };

  const handleDeleteFile = (path: string) => {
    const next = { ...vfs };
    delete next[path];
    updateFlowVfs(next);
    if (editingPath === path) setEditingPath(null);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Virtual Files {files.length > 0 && `(${files.length})`}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3 w-3 mr-1" /> Add File
        </Button>
      </div>

      {showAddForm && (
        <div className="border rounded p-3 space-y-2">
          <Input
            placeholder="file path (e.g. main.py)"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            className="text-xs font-mono"
          />
          <Textarea
            placeholder="file content..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="text-xs font-mono"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddFile} disabled={!newPath.trim()}>
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {files.length === 0 && !showAddForm && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No files yet. Add seed files for tool-enabled agents to work with.
        </p>
      )}

      {files.map(([path, content]) => (
        <div key={path} className="border rounded p-2 space-y-1">
          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-1.5 text-xs font-mono font-medium hover:text-foreground transition-colors truncate"
              onClick={() => setEditingPath(editingPath === path ? null : path)}
            >
              <FileText className="h-3 w-3 shrink-0" />
              {path}
            </button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteFile(path)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {editingPath === path ? (
            <Textarea
              value={content}
              onChange={(e) => handleUpdateContent(path, e.target.value)}
              rows={6}
              className="text-xs font-mono"
            />
          ) : (
            <pre className="text-[10px] text-muted-foreground truncate">{content.slice(0, 80)}{content.length > 80 ? '...' : ''}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
