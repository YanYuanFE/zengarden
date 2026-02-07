import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { useUser } from '@/contexts/UserContext';
import { focusApi } from '@/services/api';
import Colors from '@/constants/Colors';

const DURATIONS = [60, 900, 1500, 2700]; // seconds

export default function FocusScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useUser();

  const [duration, setDuration] = useState(60);
  const [reason, setReason] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartFocus = async () => {
    if (!user) {
      Alert.alert('Tip', 'Please connect wallet first');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Tip', 'Please enter focus reason');
      return;
    }

    setIsStarting(true);
    try {
      const result = await focusApi.start(reason.trim(), duration);
      router.push({
        pathname: '/focus-timer',
        params: {
          sessionId: result.sessionId,
          duration: String(duration),
          reason: reason.trim(),
        },
      });
      setReason('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start focus');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Section */}
      {user && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {user.totalFocusMinutes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Focus Mins
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {user.totalFlowers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Flowers
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {user.streakDays}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Streak
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Focus Section */}
      <View style={styles.focusSection}>
        <Text style={[styles.title, { color: colors.text }]}>Start Focus</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select duration, enter focus reason
        </Text>

        <View style={styles.durationContainer}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              style={[
                styles.durationButton,
                {
                  backgroundColor: duration === d ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setDuration(d)}
            >
              <Text style={[
                styles.durationText,
                { color: duration === d ? '#fff' : colors.text }
              ]}>
                {d < 60 ? d : d / 60}
              </Text>
              <Text style={[
                styles.durationUnit,
                { color: duration === d ? '#fff' : colors.textSecondary }
              ]}>
                {d < 60 ? 'sec' : 'min'}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={[styles.input, {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder="I want to focus on..."
          placeholderTextColor={colors.textSecondary}
          value={reason}
          onChangeText={setReason}
        />

        <Pressable
          style={[
            styles.startButton,
            { backgroundColor: isStarting ? colors.textSecondary : colors.primary },
          ]}
          onPress={handleStartFocus}
          disabled={isStarting}
        >
          <Text style={styles.startButtonText}>
            {isStarting ? 'Starting...' : 'Start Focus'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  focusSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  durationButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 20,
    fontWeight: '600',
  },
  durationUnit: {
    fontSize: 10,
    marginTop: 2,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
