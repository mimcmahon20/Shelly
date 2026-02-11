'use client';
import { MessageSquare, Bot, Braces, GitBranch, FileOutput, Globe } from 'lucide-react';
import type { NodeType } from '@/lib/types';

const nodeTypeItems: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'user-input', label: 'Input', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  { type: 'agent', label: 'Agent', icon: <Bot className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  { type: 'structured-output', label: 'Structured', icon: <Braces className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  { type: 'router', label: 'Router', icon: <GitBranch className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  { type: 'output', label: 'Output', icon: <FileOutput className="h-4 w-4" />, color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' },
  { type: 'html-renderer', label: 'HTML', icon: <Globe className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
];

export function NodeToolbar() {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b bg-card">
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
