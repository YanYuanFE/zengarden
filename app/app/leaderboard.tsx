import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { type CommunityUser } from '@/services/api';
import { useLeaderboard } from '@/hooks/useCommunity';
import { Avatar } from '@/components/Avatar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Format address display
function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type LeaderboardType = 'focus' | 'flowers' | 'streak';

const TABS: { key: LeaderboardType; label: string; icon: string }[] = [
  { key: 'focus', label: 'Focus', icon: 'clock-o' },
  { key: 'flowers', label: 'Flowers', icon: 'leaf' },
  { key: 'streak', label: 'Streak', icon: 'fire' },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [type, setType] = useState<LeaderboardType>('focus');
  const { data, isLoading } = useLeaderboard(type);
  const users = data?.users ?? [];

  const getValue = (user: CommunityUser) => {
    switch (type) {
      case 'flowers': return user.totalFlowers;
      case 'streak': return user.streakDays;
      default: return user.totalFocusMinutes;
    }
  };

  const getUnit = () => {
    switch (type) {
      case 'flowers': return '';
      case 'streak': return 'days';
      default: return 'mins';
    }
  };

  const renderItem = ({ item, index }: { item: CommunityUser; index: number }) => {
    const isTopThree = index < 3;
    return (
      <TouchableOpacity
        style={[
          styles.item,
          { backgroundColor: colors.card },
          isTopThree && styles.topItem,
          index === 0 && styles.firstItem,
        ]}
        onPress={() => router.push(`/user/${item.address}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.rankContainer, isTopThree && styles.topRankContainer]}>
          {isTopThree ? (
            <Text style={styles.medal}>{RANK_MEDALS[index]}</Text>
          ) : (
            <Text style={[styles.rank, { color: colors.textSecondary }]}>
              {index + 1}
            </Text>
          )}
        </View>
        <Avatar seed={item.address} size={40} backgroundColor={colors.primary + '20'} />
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.nickname || formatAddress(item.address)}
          </Text>
          <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatAddress(item.address)}
          </Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: colors.primary }]}>{getValue(item)}</Text>
          <Text style={[styles.unit, { color: colors.textSecondary }]}>{getUnit()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setType(tab.key)}
            style={[
              styles.tab,
              type === tab.key
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <FontAwesome
              name={tab.icon as any}
              size={14}
              color={type === tab.key ? '#fff' : colors.textSecondary}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                { color: type === tab.key ? '#fff' : colors.text },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Rankings Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Be the first to start focusing and earn your spot!
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    flexWrap: 'nowrap',
  },
  topItem: {
    paddingVertical: 16,
  },
  firstItem: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  rankContainer: {
    width: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  topRankContainer: {
    width: 36,
    minWidth: 36,
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
  },
  medal: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  address: {
    fontSize: 11,
  },
  valueContainer: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  unit: {
    fontSize: 11,
    marginTop: 2,
  },
});
