import { type Flower } from '@/services/api';
import { useFlowers } from '@/hooks/useFlowers';
import { Card } from '@/components/ui/card';

function EmptyState() {
  return (
    <Card className="text-center py-12">
      <span className="text-4xl mb-4 block">🌱</span>
      <p className="text-stone">No flowers yet</p>
      <p className="text-sm text-stone mt-1">Complete a focus session to generate your first flower</p>
    </Card>
  );
}

function FlowerGrid({ flowers }: { flowers: Flower[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {flowers.map((flower, i) => (
        <FlowerCard key={flower.id} flower={flower} index={i} />
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

function FlowerCard({ flower, index }: { flower: Flower; index: number }) {
  return (
    <Card
      className="p-0 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <img
        src={flower.imageUrl}
        alt="Flower"
        className="w-full aspect-square object-cover"
      />
      <div className="p-3">
        <p className="text-sm text-charcoal truncate">{flower.session.reason}</p>
        <p className="text-xs text-stone">{formatDuration(flower.session.durationSeconds)}</p>
      </div>
    </Card>
  );
}

export function GardenPage() {
  const { data: flowers = [], isLoading } = useFlowers();

  if (isLoading) {
    return (
      <div className="pt-24 pb-24 px-6 flex items-center justify-center">
        <p className="text-stone">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-6 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-charcoal mb-6">
        My Garden
      </h1>

      {flowers.length === 0 ? (
        <EmptyState />
      ) : (
        <FlowerGrid flowers={flowers} />
      )}
    </div>
  );
}
