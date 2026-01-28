import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Provider } from '@/lib/web3';
import { UserProvider } from '@/contexts/UserContext';
import { LoginPage } from '@/pages/LoginPage';
import { MainLayout } from '@/pages/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { FocusPage } from '@/pages/FocusPage';
import { GardenPage } from '@/pages/GardenPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { UserPage } from '@/pages/UserPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { MobileWrapper } from '@/components/MobileWrapper';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <UserProvider>
          <MobileWrapper>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/focus" element={<FocusPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/garden" element={<GardenPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/user/:address" element={<UserPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </MobileWrapper>
        </UserProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}
