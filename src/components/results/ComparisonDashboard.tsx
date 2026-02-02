'use client';
import { useEffect, useState, useMemo } from 'react';
import { useTestStore } from '@/stores/testStore';
import { useFlowStore } from '@/stores/flowStore';
import { RATING_DIMENSIONS } from '@/lib/types';
import type { RatingDimension } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FF8042', '#a855f7', '#ef4444'];

export function ComparisonDashboard() {
  const { batches, ratings, loadRatingsForBatches, batchRuns, loadBatchRuns } = useTestStore();
  const { flows } = useFlowStore();
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [view, setView] = useState<'bar' | 'radar' | 'table'>('bar');

  const selectedBatches = batches.filter((b) => selectedBatchIds.includes(b.id));

  useEffect(() => {
    if (selectedBatchIds.length > 0) {
      loadRatingsForBatches(selectedBatchIds);
      const allRunIds = batches
        .filter((b) => selectedBatchIds.includes(b.id))
        .flatMap((b) => b.runIds);
      loadBatchRuns(allRunIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatchIds.join(','), batches, loadRatingsForBatches, loadBatchRuns]);

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  // Build averages keyed by "batchName / flowName" so each batch+flow combo is a separate series
  const seriesAverages = useMemo(() => {
    if (selectedBatches.length === 0) return [];

    const seriesMap: Record<string, { key: string; label: string; dims: Record<RatingDimension, number[]> }> = {};

    for (const batch of selectedBatches) {
      for (const flowId of batch.flowIds) {
        const flowName = flows.find((f) => f.id === flowId)?.name ?? flowId.slice(0, 8);
        const key = `${batch.id}:${flowId}`;
        const label = selectedBatches.length > 1 ? `${batch.name} / ${flowName}` : flowName;
        seriesMap[key] = {
          key,
          label,
          dims: Object.fromEntries(RATING_DIMENSIONS.map((d) => [d, []])) as unknown as Record<RatingDimension, number[]>,
        };
      }
    }

    for (const rating of ratings) {
      const run = batchRuns.find((r) => r.id === rating.runId);
      if (!run) continue;
      // Find which batch this run belongs to
      const batch = selectedBatches.find((b) => b.runIds.includes(run.id));
      if (!batch) continue;
      const key = `${batch.id}:${run.flowId}`;
      if (!seriesMap[key]) continue;
      for (const dim of RATING_DIMENSIONS) {
        seriesMap[key].dims[dim].push(rating.ratings[dim]);
      }
    }

    return Object.values(seriesMap).map((s) => {
      const avgs: Record<string, number | string> = { key: s.key, label: s.label };
      for (const dim of RATING_DIMENSIONS) {
        const vals = s.dims[dim];
        avgs[dim] = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
      }
      return avgs;
    });
  }, [selectedBatches, ratings, batchRuns, flows]);

  const chartData = RATING_DIMENSIONS.map((dim) => {
    const entry: Record<string, string | number> = { dimension: dim };
    for (const avg of seriesAverages) {
      entry[avg.label as string] = avg[dim] as number;
    }
    return entry;
  });

  const completedBatches = batches.filter((b) => b.status !== 'running' && b.status !== 'pending');

  const hasData = seriesAverages.some((s) =>
    RATING_DIMENSIONS.some((d) => (s[d] as number) > 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Select batches to compare</label>
          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border rounded p-2">
            {completedBatches.length === 0 && (
              <p className="text-xs text-muted-foreground">No completed batches</p>
            )}
            {completedBatches.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBatchIds.includes(b.id)}
                  onChange={() => toggleBatch(b.id)}
                  className="rounded"
                />
                {b.name}
                <span className="text-xs text-muted-foreground">({b.flowIds.length} flows, {b.progress.completed} runs)</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex border rounded overflow-hidden self-end">
          {(['bar', 'radar', 'table'] as const).map((v) => (
            <button
              key={v}
              className={`px-2 py-1 text-xs ${view === v ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedBatches.length > 0 && hasData && (
        <>
          {view === 'bar' && (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                {seriesAverages.map((avg, i) => (
                  <Bar key={avg.key as string} dataKey={avg.label as string} fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}

          {view === 'radar' && (
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 5]} />
                {seriesAverages.map((avg, i) => (
                  <Radar
                    key={avg.key as string}
                    name={avg.label as string}
                    dataKey={avg.label as string}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}

          {view === 'table' && (
            <div className="border rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Batch / Flow</th>
                    {RATING_DIMENSIONS.map((d) => (
                      <th key={d} className="text-right p-2 capitalize">{d}</th>
                    ))}
                    <th className="text-right p-2">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesAverages.map((avg) => {
                    const dimValues = RATING_DIMENSIONS.map((d) => avg[d] as number);
                    const overall = dimValues.filter((v) => v > 0);
                    const overallAvg = overall.length > 0
                      ? Math.round((overall.reduce((a, b) => a + b, 0) / overall.length) * 100) / 100
                      : 0;
                    return (
                      <tr key={avg.key as string} className="border-t">
                        <td className="p-2 font-medium">{avg.label as string}</td>
                        {RATING_DIMENSIONS.map((d) => (
                          <td key={d} className="p-2 text-right">{avg[d] as number}</td>
                        ))}
                        <td className="p-2 text-right font-medium">{overallAvg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedBatches.length > 0 && !hasData && (
        <p className="text-xs text-muted-foreground text-center py-8">No ratings yet for the selected batches. Rate results first.</p>
      )}

      {selectedBatches.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">Select one or more batches above to compare results.</p>
      )}
    </div>
  );
}
