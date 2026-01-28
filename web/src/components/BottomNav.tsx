import { NavLink } from 'react-router-dom';
import { Home, Flower2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav({ className }: { className?: string }) {
  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 bg-white border-t", className)}>
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-around">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors",
              isActive ? "text-sage" : "text-stone hover:text-charcoal"
            )
          }
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Focus</span>
        </NavLink>

        <NavLink
          to="/garden"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors",
              isActive ? "text-sage" : "text-stone hover:text-charcoal"
            )
          }
        >
          <Flower2 className="h-5 w-5" />
          <span className="text-xs">Garden</span>
        </NavLink>

        <NavLink
          to="/community"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors",
              isActive ? "text-sage" : "text-stone hover:text-charcoal"
            )
          }
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Community</span>
        </NavLink>
      </div>
    </nav>
  );
}
