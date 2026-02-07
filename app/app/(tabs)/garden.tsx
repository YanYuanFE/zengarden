import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, RefreshControl, useWindowDimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useUser } from '@/contexts/UserContext';
import { flowersApi } from '@/services/api';
import Colors from '@/constants/Colors';

interface FlowerTask {
  id: string;
  status: 'pending' | 'generating' | 'uploading' | 'minting' | 'completed' | 'failed';
  error?: string;
  retryCount: number;
}

interface Flower {
  id: string;
  imageUrl?: string;
  createdAt: string;
  session: { reason: string; durationSeconds: number };
  task?: FlowerTask;
}

function getTaskStatusDisplay(task?: FlowerTask) {
  if (!task) return null;

  switch (task.status) {
    case 'pending':
      return { label: 'Waiting...', color: '#d97706', icon: 'clock' as const };
    case 'generating':
      return { label: 'Generating...', color: '#2563eb', icon: 'loader' as const };
    case 'uploading':
      return { label: 'Uploading...', color: '#2563eb', icon: 'upload-cloud' as const };
    case 'minting':
      return { label: 'Minting...', color: '#7c3aed', icon: 'zap' as const };
    case 'failed':
      return { label: 'Failed', color: '#dc2626', icon: 'alert-circle' as const };
    case 'completed':
      return null;
    default:
      return null;
  }
}

function hasInProgressTask(flowers: Flower[]): boolean {
  return flowers.some(
    (f) => f.task && ['pending', 'generating', 'uploading', 'minting'].includes(f.task.status)
  );
}

export default function GardenScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();

  const { width } = useWindowDimensions();
  const cardWidth = (width - 48) / 2;

  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingTaskId, setRetryingTaskId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFlowers = useCallback(async () => {
    if (!user) return;
    try {
      const result = await flowersApi.list();
      setFlowers(result.flowers);
      return result.flowers;
    } catch (error) {
      console.error('Failed to fetch flowers:', error);
      return [];
    }
  }, [user]);

  // Start/stop polling based on in-progress tasks
  useEffect(() => {
    if (hasInProgressTask(flowers)) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchFlowers();
        }, 3000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [flowers, fetchFlowers]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchFlowers().finally(() => setIsLoading(false));
    }
  }, [user, fetchFlowers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFlowers();
    setRefreshing(false);
  }, [fetchFlowers]);

  const handleRetry = async (taskId: string) => {
    if (retryingTaskId) return;
    setRetryingTaskId(taskId);
    try {
      await flowersApi.retryTask(taskId);
      await fetchFlowers();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetryingTaskId(null);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Please connect wallet first
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderFlowerCard = ({ item }: { item: Flower }) => {
    const statusDisplay = getTaskStatusDisplay(item.task);
    const hasImage = !!item.imageUrl;
    const isRetrying = retryingTaskId === item.task?.id;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
        {hasImage ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.border }]}>
            {statusDisplay && (
              <>
                {statusDisplay.icon === 'loader' ? (
                  <ActivityIndicator size="small" color={statusDisplay.color} />
                ) : (
                  <Feather name={statusDisplay.icon} size={24} color={statusDisplay.color} />
                )}
                <Text style={[styles.statusText, { color: statusDisplay.color }]}>
                  {statusDisplay.label}
                </Text>
              </>
            )}
            {item.task?.status === 'failed' && item.task?.id && (
              <Pressable
                style={[styles.retryButton, { borderColor: colors.primary }]}
                onPress={() => handleRetry(item.task!.id)}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={14} color={colors.primary} />
                    <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                  </>
                )}
              </Pressable>
            )}
            {item.task?.error && (
              <Text style={styles.errorText} numberOfLines={2}>
                {item.task.error}
              </Text>
            )}
          </View>
        )}
        <Text style={[styles.reason, { color: colors.text }]} numberOfLines={1}>
          {item.session.reason}
        </Text>
        <Text style={[styles.duration, { color: colors.textSecondary }]}>
          {Math.floor(item.session.durationSeconds / 60)} mins
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Garden</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {flowers.length} Flowers
        </Text>
      </View>

      <FlatList
        data={flowers}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No flowers yet. Start focusing to collect!
            </Text>
          </View>
        }
        renderItem={renderFlowerCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: 16,
  },
  card: {
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  errorText: {
    fontSize: 10,
    color: '#dc2626',
    marginTop: 8,
    textAlign: 'center',
  },
  reason: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  duration: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
