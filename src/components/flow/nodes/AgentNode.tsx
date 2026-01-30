'use client';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';

export function AgentNode({ data, selected }: NodeProps) {
  return (
    <div className={`rounded-lg border-2 bg-purple-50 px-4 py-3 shadow-sm min-w-[160px] ${selected ? 'border-purple-500' : 'border-purple-200'}`}>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-900">{data.label || 'Agent'}</span>
      </div>
      {data.systemPrompt && (
        <p className="mt-1 text-xs text-purple-600 truncate max-w-[200px]">{data.systemPrompt}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
}
