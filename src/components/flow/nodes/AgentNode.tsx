'use client';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Bot, Wrench } from 'lucide-react';

export function AgentNode({ data, selected }: NodeProps) {
  return (
    <div className={`rounded-lg border-2 bg-purple-50 dark:bg-purple-950 px-4 py-3 shadow-sm min-w-[160px] ${selected ? 'border-purple-500' : 'border-purple-200 dark:border-purple-800'}`}>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">{data.label || 'Agent'}</span>
      </div>
      {data.systemPrompt && (
        <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 truncate max-w-[200px]">{data.systemPrompt}</p>
      )}
      {data.toolsEnabled && (
        <span className="text-[10px] text-purple-500 mt-1 flex items-center gap-0.5">
          <Wrench className="h-3 w-3" /> Tools
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
}
