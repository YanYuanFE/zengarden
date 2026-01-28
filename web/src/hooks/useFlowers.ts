import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flowersApi, type Flower } from '@/services/api';

export const flowerKeys = {
  all: ['flowers'] as const,
  list: () => [...flowerKeys.all, 'list'] as const,
};

// Check if any flower has a task in progress
function hasInProgressTask(flowers: Flower[]): boolean {
  return flowers.some(
    (f) => f.task && ['pending', 'generating', 'uploading', 'minting'].includes(f.task.status)
  );
}

export function useFlowers() {
  const query = useQuery({
    queryKey: flowerKeys.list(),
    queryFn: async () => {
      const result = await flowersApi.list();
      return result.flowers;
    },
    // Poll every 3 seconds when there are in-progress tasks
    refetchInterval: (query) => {
      const flowers = query.state.data;
      if (flowers && hasInProgressTask(flowers)) {
        return 3000;
      }
      return false;
    },
  });

  return query;
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

export function useRetryTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => flowersApi.retryTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowerKeys.all });
    },
  });
}
