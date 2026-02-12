import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { type CommunityFlower } from '@/services/api';
import { useFeed, useLikeFlower } from '@/hooks/useCommunity';
import { Avatar } from '@/components/Avatar';
import { FlowerDetailModal } from '@/components/FlowerDetailModal';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommunityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data, isLoading, refetch, isRefetching } = useFeed();
  const likeMutation = useLikeFlower();
  const flowers = data?.flowers ?? [];
  const [selectedFlower, setSelectedFlower] = useState<CommunityFlower | null>(null);

  const handleLike = (flowerId: string) => {
    likeMutation.mutate(flowerId);
  };

  const renderItem = ({ item }: { item: CommunityFlower }) => {
    const userAddress = item.user?.address || '';
    const userName = item.user?.nickname || formatAddress(userAddress);

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Link href={`/user/${userAddress}`} asChild>
            <TouchableOpacity style={styles.userInfo}>
              <Avatar seed={userAddress} size={40} backgroundColor={colors.primary + '20'} />
              <View>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {userName}
                </Text>
                <Text style={[styles.duration, { color: colors.textSecondary }]}>
                  Completed {formatDuration(item.session?.durationSeconds || 0)} focus
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>

        <Text style={[styles.reason, { color: colors.text }]}>
          {item.session?.reason || ''}
        </Text>

        {item.imageUrl && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedFlower(item)}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => handleLike(item.id)}
        >
          <Feather name="heart" size={18} color={colors.textSecondary} />
          <Text style={[styles.likeCount, { color: colors.textSecondary }]}>
            {item._count?.likes || 0}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <Link href="/leaderboard" asChild>
          <TouchableOpacity style={[styles.leaderboardBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>🏆 Leaderboard</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={flowers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>No activity yet</Text>
          </View>
        }
      />

      <FlowerDetailModal
        flower={selectedFlower}
        visible={!!selectedFlower}
        onClose={() => setSelectedFlower(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { padding: 16, alignItems: 'flex-end' },
  leaderboardBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  list: { padding: 16, gap: 16 },
  card: { borderRadius: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userName: { fontWeight: '600', fontSize: 15 },
  duration: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 12 },
  reason: { fontSize: 15, marginBottom: 12 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 12 },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { fontSize: 14 },
  empty: { padding: 48, alignItems: 'center' },
});
