import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { focusApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DURATIONS = [
  { value: 60, label: '1m' },
  { value: 900, label: '15m' },
  { value: 1500, label: '25m' },
  { value: 2700, label: '45m' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (!user || !reason.trim()) return;

    setIsStarting(true);
    try {
      const result = await focusApi.start(reason.trim(), duration);
      navigate('/focus', {
        state: {
          sessionId: result.sessionId,
          duration,
          reason: reason.trim(),
        },
      });
    } catch (error) {
      console.error('Start focus error:', error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="pt-24 pb-24 px-6 max-w-md mx-auto">
      {/* Stats */}
      <Card className="mb-8 animate-fade-in">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-display font-bold text-sage">
              {user?.totalFocusMinutes || 0}
            </p>
            <p className="text-xs text-stone">Focus Mins</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-coral">
              {user?.totalFlowers || 0}
            </p>
            <p className="text-xs text-stone">Flowers</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-charcoal">
              {user?.streakDays || 0}
            </p>
            <p className="text-xs text-stone">Streak Days</p>
          </div>
        </div>
      </Card>

      {/* Focus Form */}
      <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Focus Reason
          </label>
          <Input
            placeholder="What do you want to focus on?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-3">
            Focus Duration
          </label>
          <div className="grid grid-cols-5 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={cn(
                  "py-3 rounded-xl text-sm font-medium transition-all",
                  duration === d.value
                    ? "bg-sage text-white"
                    : "bg-white border text-charcoal hover:border-sage"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={!reason.trim() || isStarting}
        >
          {isStarting ? 'Starting...' : 'Start Focus'}
        </Button>
      </div >
    </div >
  );
}
