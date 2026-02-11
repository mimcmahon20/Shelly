'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTestStore } from '@/stores/testStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RATING_DIMENSIONS } from '@/lib/types';
import type { RunRating, RatingDimension } from '@/lib/types';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { ViewportPreview } from '@/components/shared/ViewportPreview';

export function RatingOverlay() {
  const { ratingRunIds, ratingIndex, setRatingIndex, exitRatingMode, batchRuns, saveRating, ratings } = useTestStore();

  const [localRatings, setLocalRatings] = useState<Record<RatingDimension, number>>({
    usability: 3, responsiveness: 3, design: 3, quality: 3, accuracy: 3,
  });
  const [notes, setNotes] = useState('');
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [inputExpanded, setInputExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dirtyRef = useRef(false);

  const currentRunId = ratingRunIds[ratingIndex];
  const currentRun = batchRuns.find((r) => r.id === currentRunId);

  // Load existing rating
  useEffect(() => {
    if (!currentRunId) return;
    const existing = ratings.find((r) => r.runId === currentRunId);
    if (existing) {
      setLocalRatings(existing.ratings);
      setNotes(existing.notes ?? '');
      setRatingId(existing.id);
    } else {
      setLocalRatings({ usability: 3, responsiveness: 3, design: 3, quality: 3, accuracy: 3 });
      setNotes('');
      setRatingId(null);
    }
    dirtyRef.current = false;
    setInputExpanded(false);
  }, [currentRunId, ratings]);

  // Auto-save debounced
  const autoSave = useCallback(() => {
    if (!currentRunId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const batch = useTestStore.getState().batches.find((b) =>
        b.runIds.includes(currentRunId)
      );
      const rating: RunRating = {
        id: ratingId ?? crypto.randomUUID(),
        runId: currentRunId,
        batchId: batch?.id ?? '',
        ratings: localRatings,
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
      };
      setRatingId(rating.id);
      saveRating(rating);
    }, 500);
  }, [currentRunId, localRatings, notes, ratingId, saveRating]);

  useEffect(() => {
    if (dirtyRef.current) autoSave();
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [localRatings, notes, autoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && ratingIndex > 0) {
        setRatingIndex(ratingIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (ratingIndex < ratingRunIds.length - 1) {
          setRatingIndex(ratingIndex + 1);
        } else {
          exitRatingMode();
        }
      } else if (e.key === 'Escape') {
        exitRatingMode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ratingIndex, ratingRunIds.length, setRatingIndex, exitRatingMode]);

  if (ratingRunIds.length === 0) return null;

  const isHtml = currentRun?.finalOutput && currentRun.finalOutput.includes('<') && currentRun.finalOutput.includes('>');

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm font-medium">
          Rating {ratingIndex + 1} of {ratingRunIds.length}
        </span>
        <Button variant="ghost" size="sm" onClick={exitRatingMode}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: output preview */}
        <div className="flex-1 overflow-auto p-4 border-r">
          <div
            className="text-xs text-muted-foreground mb-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setInputExpanded((v) => !v)}
          >
            <span className="font-medium text-foreground/70">Input:</span>{' '}
            <span className={inputExpanded ? '' : 'line-clamp-2'}>
              {currentRun ? (typeof currentRun.userInput === 'object'
                ? Object.entries(currentRun.userInput).map(([k, v]) => `${k}: ${v}`).join(', ')
                : currentRun.userInput) : ''}
            </span>
          </div>
          {isHtml ? (
            <ViewportPreview html={currentRun!.finalOutput} className="h-[calc(100%-2rem)]" />
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{currentRun?.finalOutput}</pre>
          )}
        </div>

        {/* Right: rating controls */}
        <div className="w-80 p-4 overflow-y-auto space-y-4">
          {RATING_DIMENSIONS.map((dim) => (
            <div key={dim}>
              <label className="text-xs font-medium capitalize mb-1 block">{dim}</label>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={localRatings[dim] === v ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => { dirtyRef.current = true; setLocalRatings((prev) => ({ ...prev, [dim]: v })); }}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <label className="text-xs font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => { dirtyRef.current = true; setNotes(e.target.value); }}
              placeholder="Optional notes..."
              rows={4}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-4 py-2 border-t">
        <Button
          variant="outline"
          size="sm"
          disabled={ratingIndex === 0}
          onClick={() => setRatingIndex(ratingIndex - 1)}
        >
          <ChevronLeft className="h-3 w-3 mr-1" /> Prev
        </Button>
        <div className="flex gap-1">
          {ratingRunIds.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full ${i === ratingIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              onClick={() => setRatingIndex(i)}
            />
          ))}
        </div>
        {ratingIndex === ratingRunIds.length - 1 ? (
          <Button size="sm" onClick={exitRatingMode}>
            <Check className="h-3 w-3 mr-1" /> Done
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRatingIndex(ratingIndex + 1)}
          >
            Next <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
