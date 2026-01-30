'use client';
import { MessageSquare, Bot, Braces, GitBranch, FileOutput } from 'lucide-react';
import type { NodeType } from '@/lib/types';

const nodeTypeItems: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'user-input', label: 'Input', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { type: 'agent', label: 'Agent', icon: <Bot className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { type: 'structured-output', label: 'Structured', icon: <Braces className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { type: 'router', label: 'Router', icon: <GitBranch className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { type: 'output', label: 'Output', icon: <FileOutput className="h-4 w-4" />, color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export function NodeToolbar() {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex gap-2 p-2 border-b bg-card">
      <span className="text-xs text-muted-foreground self-center mr-2">Drag to add:</span>
      {nodeTypeItems.map((item) => (
        <div
          key={item.type}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-grab text-xs font-medium ${item.color}`}
          draggable
          onDragStart={(e) => onDragStart(e, item.type)}
        >
          {item.icon}
          {item.label}
        </div>
      ))}
    </div>
  );
}
