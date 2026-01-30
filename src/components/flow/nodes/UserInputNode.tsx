'use client';
import { Handle, Position, type NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';

export function UserInputNode({ data, selected }: NodeProps) {
  return (
    <div className={`rounded-lg border-2 bg-blue-50 px-4 py-3 shadow-sm min-w-[160px] ${selected ? 'border-blue-500' : 'border-blue-200'}`}>
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">{data.label || 'User Input'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
}
