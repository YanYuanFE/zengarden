import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/services/api';

export const communityKeys = {
  all: ['community'] as const,
  feed: () => [...communityKeys.all, 'feed'] as const,
  user: (address: string) => [...communityKeys.all, 'user', address] as const,
  garden: (address: string) => [...communityKeys.all, 'garden', address] as const,
  leaderboard: (type: string) => [...communityKeys.all, 'leaderboard', type] as const,
};

export function useFeed(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...communityKeys.feed(), page, limit],
    queryFn: () => communityApi.getFeed(page, limit),
  });
}

export function useUser(address: string) {
  return useQuery({
    queryKey: communityKeys.user(address),
    queryFn: () => communityApi.getUser(address),
    enabled: !!address,
  });
}

export function useUserGarden(address: string) {
  return useQuery({
    queryKey: communityKeys.garden(address),
    queryFn: () => communityApi.getUserGarden(address),
    enabled: !!address,
  });
}

export function useLeaderboard(type: 'focus' | 'flowers' | 'streak') {
  return useQuery({
    queryKey: communityKeys.leaderboard(type),
    queryFn: () => communityApi.getLeaderboard(type),
  });
}

export function useLikeFlower() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flowerId: string) => communityApi.likeFlower(flowerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.feed() });
    },
  });
}
