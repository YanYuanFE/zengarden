import { Outlet, Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

export function MainLayout() {
  const { user, isInitialized } = useUser();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-breathe">
          <span className="text-4xl">🌸</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative h-full w-full bg-cream overflow-hidden">
      <Header className="absolute" />
      <main className="h-full w-full overflow-y-auto pt-16 pb-16">
        <Outlet />
      </main>
      <BottomNav className="absolute" />
    </div>
  );
}
