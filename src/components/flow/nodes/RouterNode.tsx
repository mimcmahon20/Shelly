'use client';
import { Handle, Position, type NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

export function RouterNode({ data, selected }: NodeProps) {
  return (
    <div className={`rounded-lg border-2 bg-amber-50 px-4 py-3 shadow-sm min-w-[160px] ${selected ? 'border-amber-500' : 'border-amber-200'}`}>
      <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-900">{data.label || 'Router'}</span>
      </div>
      {data.routingRules?.length > 0 && (
        <p className="mt-1 text-xs text-amber-600">{data.routingRules.length} rule(s)</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3 !h-3" />
    </div>
  );
}
