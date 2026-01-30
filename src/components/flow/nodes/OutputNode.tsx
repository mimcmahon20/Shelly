'use client';
import { Handle, Position, type NodeProps } from 'reactflow';
import { FileOutput } from 'lucide-react';

export function OutputNode({ data, selected }: NodeProps) {
  return (
    <div className={`rounded-lg border-2 bg-rose-50 px-4 py-3 shadow-sm min-w-[160px] ${selected ? 'border-rose-500' : 'border-rose-200'}`}>
      <Handle type="target" position={Position.Top} className="!bg-rose-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <FileOutput className="h-4 w-4 text-rose-600" />
        <span className="text-sm font-medium text-rose-900">{data.label || 'Output'}</span>
      </div>
    </div>
  );
}
