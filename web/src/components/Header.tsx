import { useUser } from '@/contexts/UserContext';
import { formatAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

export function Header({ className }: { className?: string }) {
  const { user, logout } = useUser();

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-sm border-b", className)}>
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ZenGarden" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-xl font-semibold text-charcoal">
            ZenGarden
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone">
              {formatAddress(user.address)}
            </span>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
