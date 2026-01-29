import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, AppState, AppStateStatus } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { CompletionModal } from '@/components/CompletionModal';
import { focusApi, flowersApi } from '@/services/api';
import Colors from '@/constants/Colors';

export default function FocusTimerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    duration: string;
    reason: string;
  }>();

  const duration = parseFloat(params.duration || '25');
  const [remainingSeconds, setRemainingSeconds] = useState(duration);
  const [isCompleted, setIsCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStatus, setModalStatus] = useState<'completed' | 'generating' | 'success' | 'error' | 'interrupted'>('completed');
  const [flowerUrl, setFlowerUrl] = useState<string | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle app state changes - interrupt focus when app goes to background
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (
      appState.current === 'active' &&
      nextAppState.match(/inactive|background/) &&
      !isCompleted
    ) {
      // App going to background while focus is active - interrupt it
      try {
        if (params.sessionId) {
          await focusApi.interrupt(params.sessionId);
        }
      } catch (error) {
        console.error('Failed to interrupt focus:', error);
      }
      setIsCompleted(true);
      setModalStatus('interrupted');
      setModalVisible(true);
    }
    appState.current = nextAppState;
  }, [isCompleted, params.sessionId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted]);

  const handleComplete = useCallback(async () => {
    if (isCompleted || !params.sessionId) return;
    setIsCompleted(true);

    try {
      await focusApi.complete(params.sessionId);
      setModalStatus('completed');
      setModalVisible(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, [params.sessionId, isCompleted]);

  const generateFlower = async () => {
    if (!params.sessionId) return;
    setModalStatus('generating');

    try {
      const result = await flowersApi.generate(params.sessionId);
      const taskId = result.taskId;
      setCurrentTaskId(taskId);

      await pollTaskStatus(taskId);
    } catch (error: any) {
      setModalStatus('error');
      setErrorMsg(error.message);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string): Promise<void> => {
    try {
      const taskResult = await flowersApi.getTask(taskId);
      const task = taskResult.task;

      switch (task.status) {
        case 'completed':
          setModalStatus('success');
          setFlowerUrl(task.flower?.imageUrl);
          return;
        case 'failed':
          setModalStatus('error');
          setErrorMsg(task.error || 'Generation failed');
          return;
        case 'pending':
        case 'generating':
        case 'uploading':
        case 'minting':
          // 继续轮询
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return pollTaskStatus(taskId);
        default:
          return;
      }
    } catch (error: any) {
      setModalStatus('error');
      setErrorMsg(error.message);
    }
  };

  // 重试失败的任务
  const retryFlower = async () => {
    if (!currentTaskId) {
      // 没有 taskId，重新生成
      return generateFlower();
    }

    setModalStatus('generating');

    try {
      await flowersApi.retryTask(currentTaskId);
      await pollTaskStatus(currentTaskId);
    } catch (error: any) {
      setModalStatus('error');
      setErrorMsg(error.message);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    router.back();
  };

  const handleViewGarden = () => {
    setModalVisible(false);
    router.replace('/(tabs)/garden');
  };

  const handleInterrupt = () => {
    Alert.alert('Confirm Interrupt', 'Are you sure you want to interrupt? You won\'t get a flower.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Interrupt',
        style: 'destructive',
        onPress: async () => {
          try {
            if (params.sessionId) {
              await focusApi.interrupt(params.sessionId);
            }
            router.back();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const progress = 1 - remainingSeconds / duration;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.reason, { color: colors.textSecondary }]}>
          {params.reason || 'Focusing'}
        </Text>

        <View style={styles.timerContainer}>
          <View style={[styles.timerRing, { borderColor: 'transparent' }]}>
            <Svg width="240" height="240" viewBox="0 0 240 240">
              <G rotation="-90" origin="120, 120">
                {/* Background Circle */}
                <Circle
                  cx="120"
                  cy="120"
                  r="116"
                  stroke={colors.border}
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Circle */}
                <Circle
                  cx="120"
                  cy="120"
                  r="116"
                  stroke={colors.primary}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 116}
                  strokeDashoffset={2 * Math.PI * 116 * (1 - progress)}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
            <View style={styles.timerTextContainer}>
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(remainingSeconds)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {isCompleted
            ? 'Focus Completed!'
            : 'Stay focused, do not leave the app'}
        </Text>
      </View>

      {!isCompleted && (
        <Pressable
          style={[styles.interruptButton, { borderColor: colors.border }]}
          onPress={handleInterrupt}
        >
          <Text style={[styles.interruptText, { color: colors.textSecondary }]}>
            Interrupt Focus
          </Text>
        </Pressable>
      )}

      <CompletionModal
        visible={modalVisible}
        status={modalStatus}
        flowerUrl={flowerUrl}
        error={errorMsg}
        onGenerate={generateFlower}
        onViewGarden={handleViewGarden}
        onClose={handleModalClose}
        onRetry={retryFlower}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reason: {
    fontSize: 18,
    marginBottom: 40,
  },
  timerContainer: {
    marginBottom: 40,
  },
  timerRing: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 14,
  },
  interruptButton: {
    marginHorizontal: 24,
    marginBottom: 48,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  interruptText: {
    fontSize: 16,
  },
});
