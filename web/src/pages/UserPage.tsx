import { useParams, Link } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';
import { useUser, useUserGarden } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function UserPage() {
  const { address } = useParams<{ address: string }>();
  const { data: userData, isLoading: userLoading } = useUser(address || '');
  const { data: gardenData, isLoading: gardenLoading } = useUserGarden(address || '');

  const user = userData?.user;
  const flowers = gardenData?.flowers ?? [];
  const loading = userLoading || gardenLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/community">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-2xl p-6 mb-6 text-center">
          <div className="mx-auto mb-4 w-fit">
            <UserAvatar address={user.address} size={80} />
          </div>
          <h1 className="font-display text-xl font-bold text-charcoal mb-1">
            {user.nickname || formatAddress(user.address)}
          </h1>
          <p className="text-sm text-stone mb-4">{user.address}</p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-charcoal">{user.totalFocusMinutes}</p>
              <p className="text-xs text-stone">Focus Mins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{user.totalFlowers}</p>
              <p className="text-xs text-stone">Flowers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{user.streakDays}</p>
              <p className="text-xs text-stone">Streak Days</p>
            </div>
          </div>
        </div>

        {/* Garden */}
        <h2 className="font-display text-lg font-bold text-charcoal mb-4">Garden</h2>
        <div className="grid grid-cols-3 gap-2">
          {flowers.map((flower) => (
            <div key={flower.id} className="aspect-square rounded-xl overflow-hidden">
              {flower.imageUrl && (
                <img
                  src={flower.imageUrl}
                  alt="Flower"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {flowers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone">No flowers yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
