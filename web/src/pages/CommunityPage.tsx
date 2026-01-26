import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';
import { type CommunityFlower } from '@/services/api';
import { useFeed, useLikeFlower } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function CommunityPage() {
  const { data, isLoading } = useFeed();
  const likeMutation = useLikeFlower();
  const flowers = data?.flowers ?? [];

  const handleLike = (flowerId: string) => {
    likeMutation.mutate(flowerId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-charcoal">Community</h1>
          <Link to="/leaderboard">
            <Button variant="outline" size="sm">Leaderboard</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {flowers.map((flower) => (
            <FlowerCard
              key={flower.id}
              flower={flower}
              onLike={() => handleLike(flower.id)}
            />
          ))}
        </div>

        {flowers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface FlowerCardProps {
  flower: CommunityFlower;
  onLike: () => void;
}

function FlowerCard({ flower, onLike }: FlowerCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar address={flower.user.address} size={40} />
        <div className="flex-1">
          <Link
            to={`/user/${flower.user.address}`}
            className="font-medium text-charcoal hover:text-sage"
          >
            {flower.user.nickname || formatAddress(flower.user.address)}
          </Link>
          <p className="text-xs text-stone">
            Completed {formatDuration(flower.session.durationSeconds)} focus
          </p>
        </div>
        <span className="text-xs text-stone">{formatTime(flower.createdAt)}</span>
      </div>

      <p className="text-charcoal mb-3">{flower.session.reason}</p>

      {flower.imageUrl && (
        <img
          src={flower.imageUrl}
          alt="Flower"
          className="w-full aspect-square rounded-xl object-cover mb-3"
        />
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={onLike}
          className="flex items-center gap-1 text-stone hover:text-coral transition-colors"
        >
          <Heart className="w-5 h-5" />
          <span className="text-sm">{flower._count.likes}</span>
        </button>
      </div>
    </div>
  );
}
