'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ViewportPreview } from '@/components/shared/ViewportPreview';

interface HtmlPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  title?: string;
}

export function HtmlPreviewModal({ open, onOpenChange, html, title }: HtmlPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[85vw] w-[85vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title || 'HTML Preview'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0">
          <ViewportPreview html={html} className="h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
