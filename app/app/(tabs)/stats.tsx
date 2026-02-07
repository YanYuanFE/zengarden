import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Please connect wallet first
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Focus Stats</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Total Focus" value={String(user.totalFocusMinutes)} unit="mins" colors={colors} />
        <StatCard label="Flowers Collected" value={String(user.totalFlowers)} unit="" colors={colors} />
        <StatCard label="Streak Days" value={String(user.streakDays)} unit="days" colors={colors} />
      </View>
    </View>
  );
}

function StatCard({ label, value, unit, colors }: {
  label: string;
  value: string;
  unit: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statUnit, { color: colors.textSecondary }]}>{unit}</Text>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
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
  emptyText: {
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  statCard: {
    width: '45%',
    margin: '2.5%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 14,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 8,
  },
});
