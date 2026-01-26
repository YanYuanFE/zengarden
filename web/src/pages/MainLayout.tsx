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
    <div className="min-h-screen bg-cream">
      <Header />
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
