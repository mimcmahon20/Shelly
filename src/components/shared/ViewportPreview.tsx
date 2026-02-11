'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Smartphone, Tablet, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewportMode = 'mobile' | 'tablet' | 'laptop';

const VIEWPORTS: Record<ViewportMode, { w: number; h: number; icon: typeof Smartphone; label: string }> = {
  mobile: { w: 375, h: 667, icon: Smartphone, label: 'Mobile' },
  tablet: { w: 768, h: 1024, icon: Tablet, label: 'Tablet' },
  laptop: { w: 1366, h: 768, icon: Laptop, label: 'Laptop' },
};

interface ViewportPreviewProps {
  html: string;
  className?: string;
  defaultViewport?: ViewportMode;
}

export function ViewportPreview({ html, className, defaultViewport = 'laptop' }: ViewportPreviewProps) {
  const [mode, setMode] = useState<ViewportMode>(defaultViewport);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    }
  }, []);

  useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const vp = VIEWPORTS[mode];
  const scale = containerSize.w > 0 && containerSize.h > 0
    ? Math.min(containerSize.w / vp.w, containerSize.h / vp.h, 1)
    : 1;
  const scaledW = vp.w * scale;
  const scaledH = vp.h * scale;
  const pct = Math.round(scale * 100);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Viewport toggle buttons */}
      <div className="flex items-center gap-1 mb-2">
        {(Object.entries(VIEWPORTS) as [ViewportMode, typeof vp][]).map(([key, v]) => {
          const Icon = v.icon;
          const isActive = mode === key;
          return (
            <Button
              key={key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setMode(key)}
            >
              <Icon className="h-3 w-3" />
              {v.label}
            </Button>
          );
        })}
        <span className="text-[10px] text-muted-foreground ml-2">
          {vp.w} &times; {vp.h} ({pct}%)
        </span>
      </div>

      {/* Scaled iframe container */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden">
        <div style={{ width: scaledW, height: scaledH }}>
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            title="Viewport Preview"
            style={{
              width: vp.w,
              height: vp.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 'none',
            }}
            className="rounded-md bg-white"
          />
        </div>
      </div>
    </div>
  );
}
