import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flowersApi } from '@/services/api';

export const flowerKeys = {
  all: ['flowers'] as const,
  list: () => [...flowerKeys.all, 'list'] as const,
};

export function useFlowers() {
  return useQuery({
    queryKey: flowerKeys.list(),
    queryFn: async () => {
      const result = await flowersApi.list();
      return result.flowers;
    },
  });
}

export function useGenerateFlower() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => flowersApi.generate(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowerKeys.all });
    },
  });
}
