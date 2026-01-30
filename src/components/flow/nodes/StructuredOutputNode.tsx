'use client';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Braces } from 'lucide-react';

export function StructuredOutputNode({ data, selected }: NodeProps) {
  return (
    <div className={`rounded-lg border-2 bg-emerald-50 px-4 py-3 shadow-sm min-w-[160px] ${selected ? 'border-emerald-500' : 'border-emerald-200'}`}>
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <Braces className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-900">{data.label || 'Structured Output'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
    </div>
  );
}
