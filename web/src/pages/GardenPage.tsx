import { useState } from 'react';
import { type Flower } from '@/services/api';
import { useFlowers, useRetryTask } from '@/hooks/useFlowers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlowerDetailModal } from '@/components/FlowerDetailModal';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}

function getTaskStatusDisplay(task?: Flower['task']) {
  if (!task) return null;
  switch (task.status) {
    case 'pending':
      return { label: 'Waiting...', color: 'text-amber-600', icon: 'waiting' };
    case 'generating':
      return { label: 'Generating...', color: 'text-blue-600', icon: 'loading' };
    case 'uploading':
      return { label: 'Uploading...', color: 'text-blue-600', icon: 'loading' };
    case 'minting':
      return { label: 'Minting...', color: 'text-purple-600', icon: 'loading' };
    case 'failed':
      return { label: 'Failed', color: 'text-red-600', icon: 'error' };
    case 'completed':
      return null;
    default:
      return null;
  }
}

// ─── Flower Card ─────────────────────────────────────────

function FlowerCard({
  flower,
  index,
  onRetry,
  isRetrying,
  onSelect,
}: {
  flower: Flower;
  index: number;
  onRetry: (taskId: string) => void;
  isRetrying: boolean;
  onSelect: (flower: Flower) => void;
}) {
  const statusDisplay = getTaskStatusDisplay(flower.task);
  const hasImage = !!flower.imageUrl;

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!flower.task?.id || isRetrying) return;
    onRetry(flower.task.id);
  };

  return (
    <Card
      className={`p-0 overflow-hidden animate-fade-in ${hasImage ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => hasImage && onSelect(flower)}
    >
      {hasImage ? (
        <img
          src={flower.imageUrl}
          alt="Flower"
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-sage/20 to-coral/20 flex flex-col items-center justify-center">
          {statusDisplay?.icon === 'loading' && (
            <Loader2 className="w-8 h-8 text-sage animate-spin mb-2" />
          )}
          {statusDisplay?.icon === 'waiting' && (
            <div className="w-8 h-8 text-amber-500 mb-2">⏳</div>
          )}
          {statusDisplay?.icon === 'error' && (
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          )}
          {statusDisplay && (
            <span className={`text-sm font-medium ${statusDisplay.color}`}>
              {statusDisplay.label}
            </span>
          )}
          {flower.task?.status === 'failed' && flower.task?.id && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Retry
            </Button>
          )}
          {flower.task?.error && (
            <p className="text-xs text-red-500 mt-2 px-2 text-center line-clamp-2">
              {flower.task.error}
            </p>
          )}
        </div>
      )}
      <div className="p-3">
        <p className="text-sm text-charcoal truncate">{flower.session.reason}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-stone">{formatDuration(flower.session.durationSeconds)}</p>
          {flower.minted && (
            <span className="text-[10px] font-medium text-sage bg-sage/10 px-1.5 py-0.5 rounded-full">NFT</span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────

export function GardenPage() {
  const { data: flowers = [], isLoading } = useFlowers();
  const retryMutation = useRetryTask();
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);

  const handleRetry = (taskId: string) => {
    retryMutation.mutate(taskId);
  };

  if (isLoading) {
    return (
      <div className="pt-24 pb-24 px-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-sage mr-2" />
        <p className="text-stone">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-6 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-charcoal mb-6">
        My Garden
      </h1>

      {flowers.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">🌱</span>
          <p className="text-stone">No flowers yet</p>
          <p className="text-sm text-stone mt-1">Complete a focus session to generate your first flower</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {flowers.map((flower, i) => (
            <FlowerCard
              key={flower.id}
              flower={flower}
              index={i}
              onRetry={handleRetry}
              isRetrying={retryMutation.isPending && retryMutation.variables === flower.task?.id}
              onSelect={setSelectedFlower}
            />
          ))}
        </div>
      )}

      {selectedFlower && (
        <FlowerDetailModal
          flower={selectedFlower}
          onClose={() => setSelectedFlower(null)}
        />
      )}
    </div>
  );
}
