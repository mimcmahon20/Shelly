'use client';
import { useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Globe } from 'lucide-react';
import { useRunStore } from '@/stores/runStore';
import { useFlowStore } from '@/stores/flowStore';
import { HtmlPreviewModal } from '@/components/shared/HtmlPreviewModal';

export function HtmlRendererNode({ id, data, selected }: NodeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const runs = useRunStore((s) => s.runs);

  const latestRun = runs
    .filter((r) => r.flowId === currentFlowId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  const nodeResult = latestRun?.nodeResults.find((r) => r.nodeId === id);
  const htmlContent = typeof nodeResult?.output === 'string' ? nodeResult.output : '';

  return (
    <>
      <div
        className={`rounded-lg border-2 bg-cyan-50 px-4 py-3 shadow-sm min-w-[160px] cursor-pointer ${selected ? 'border-cyan-500' : 'border-cyan-200'}`}
        onClick={(e) => {
          if (htmlContent) {
            e.stopPropagation();
            setModalOpen(true);
          }
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-cyan-500 !w-3 !h-3" />
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-600" />
          <span className="text-sm font-medium text-cyan-900">{data.label || 'HTML Renderer'}</span>
        </div>
        {htmlContent && (
          <p className="text-[10px] text-cyan-600 mt-1">Click to preview</p>
        )}
        <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3" />
      </div>
      <HtmlPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        html={htmlContent}
        title={data.label || 'HTML Renderer'}
      />
    </>
  );
}
