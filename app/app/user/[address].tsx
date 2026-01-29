import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser, useUserGarden } from '@/hooks/useCommunity';
import { Avatar } from '@/components/Avatar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function UserScreen() {
  const { address } = useLocalSearchParams<{ address: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: userData, isLoading: userLoading } = useUser(address || '');
  const { data: gardenData, isLoading: gardenLoading } = useUserGarden(address || '');

  const user = userData?.user;
  const flowers = gardenData?.flowers ?? [];
  const loading = userLoading || gardenLoading;

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={{ color: colors.textSecondary }}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {user.nickname || formatAddress(user.address)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={flowers}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Profile Card */}
            <View style={[styles.profile, { backgroundColor: colors.card }]}>
              <Avatar seed={user.address} size={80} backgroundColor={colors.primary + '20'} />
              <Text style={[styles.name, { color: colors.text }]}>
                {user.nickname || formatAddress(user.address)}
              </Text>
              <Text style={[styles.address, { color: colors.textSecondary }]}>
                {user.address}
              </Text>

              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {user.totalFocusMinutes}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Focus Mins
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {user.totalFlowers}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Flowers
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {user.streakDays}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Streak
                  </Text>
                </View>
              </View>
            </View>

            {/* Section Title */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Garden</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
            ) : (
              <View style={[styles.gridPlaceholder, { backgroundColor: colors.card }]}>
                <Text style={styles.gridPlaceholderText}>🌱</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No flowers yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  profile: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 3,
  },
  gridImage: {
    flex: 1,
    borderRadius: 12,
  },
  gridPlaceholder: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPlaceholderText: {
    fontSize: 24,
  },
  empty: {
    padding: 48,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
