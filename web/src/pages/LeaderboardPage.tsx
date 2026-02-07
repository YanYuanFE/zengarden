import { useState } from 'react';
import { UserAvatar } from '@/components/UserAvatar';
import { Link } from 'react-router-dom';
import { type CommunityUser } from '@/services/api';
import { useLeaderboard } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type LeaderboardType = 'focus' | 'flowers' | 'streak';

const TABS: { key: LeaderboardType; label: string }[] = [
  { key: 'focus', label: 'Focus Time' },
  { key: 'flowers', label: 'Flowers' },
  { key: 'streak', label: 'Streak' },
];

export function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>('focus');
  const { data, isLoading } = useLeaderboard(type);
  const users = data?.users ?? [];

  const getValue = (user: CommunityUser) => {
    switch (type) {
      case 'flowers':
        return user.totalFlowers;
      case 'streak':
        return user.streakDays;
      default:
        return user.totalFocusMinutes;
    }
  };

  const getUnit = () => {
    switch (type) {
      case 'flowers':
        return '';
      case 'streak':
        return 'days';
      default:
        return 'mins';
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/community">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 className="font-display text-xl font-bold text-charcoal">Leaderboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setType(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${type === tab.key
                ? 'bg-sage text-white'
                : 'bg-white text-stone hover:bg-sage/10'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-center text-stone py-12">Loading...</p>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => (
              <Link
                key={user.id}
                to={`/user/${user.address}`}
                className="flex items-center gap-4 bg-white rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <span className={`w-8 text-center font-bold ${index < 3 ? 'text-coral' : 'text-stone'
                  }`}>
                  {index + 1}
                </span>
                <UserAvatar address={user.address} size={40} />
                <div className="flex-1">
                  <p className="font-medium text-charcoal">
                    {user.nickname || formatAddress(user.address)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-charcoal">{getValue(user)}</p>
                  <p className="text-xs text-stone">{getUnit()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
