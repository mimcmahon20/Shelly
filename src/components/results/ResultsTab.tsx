'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BatchResults } from './BatchResults';
import { ComparisonDashboard } from './ComparisonDashboard';
import { RatingOverlay } from './RatingOverlay';
import { useTestStore } from '@/stores/testStore';

export function ResultsTab() {
  const { ratingRunIds } = useTestStore();

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="detail">
          <TabsList>
            <TabsTrigger value="detail">Batch Detail</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
          </TabsList>
          <TabsContent value="detail">
            <BatchResults />
          </TabsContent>
          <TabsContent value="compare">
            <ComparisonDashboard />
          </TabsContent>
        </Tabs>
      </div>
      {ratingRunIds.length > 0 && <RatingOverlay />}
    </div>
  );
}
