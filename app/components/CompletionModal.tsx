import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

interface CompletionModalProps {
  visible: boolean;
  status: 'completed' | 'generating' | 'success' | 'error' | 'interrupted';
  flowerUrl?: string;
  error?: string;
  onGenerate: () => void;
  onViewGarden: () => void;
  onClose: () => void;
  onRetry?: () => void;
}

export function CompletionModal({
  visible,
  status,
  flowerUrl,
  error,
  onGenerate,
  onViewGarden,
  onClose,
  onRetry,
}: CompletionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const renderContent = () => {
    switch (status) {
      case 'completed':
        return (
          <>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={[styles.title, { color: colors.text }]}>Focus Completed!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Great job! Would you like to grow a flower from this session?
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Maybe Later</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={onGenerate}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Generate Flower</Text>
              </Pressable>
            </View>
          </>
        );

      case 'generating':
        return (
          <>
            <View style={styles.loadingContainer}>
              <Animated.Text
                style={[
                  styles.loadingEmoji,
                  {
                    transform: [
                      {
                        rotate: scaleAnim.interpolate({
                          inputRange: [0.8, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                🌸
              </Animated.Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Growing Your Flower...</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              AI is creating a unique flower based on your focus session
            </Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>
          </>
        );

      case 'success':
        return (
          <>
            <View style={styles.flowerContainer}>
              {flowerUrl ? (
                <Image source={{ uri: flowerUrl }} style={styles.flowerImage} />
              ) : (
                <Text style={styles.emoji}>🌺</Text>
              )}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Flower Generated!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your unique flower has been added to your garden
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.fullButton, { backgroundColor: colors.primary }]}
                onPress={onViewGarden}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>View My Garden</Text>
              </Pressable>
            </View>
          </>
        );

      case 'error':
        return (
          <>
            <Text style={styles.emoji}>😢</Text>
            <Text style={[styles.title, { color: colors.text }]}>Generation Failed</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {error || 'Something went wrong. Please try again.'}
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Close</Text>
              </Pressable>
              {onRetry && (
                <Pressable
                  style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={onRetry}
                >
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Retry</Text>
                </Pressable>
              )}
            </View>
          </>
        );

      case 'interrupted':
        return (
          <>
            <Text style={styles.emoji}>😔</Text>
            <Text style={[styles.title, { color: colors.text }]}>Focus Interrupted</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              You left the app during focus. Stay on the app to complete your session and earn a flower.
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.fullButton, { backgroundColor: colors.primary }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Got It</Text>
              </Pressable>
            </View>
          </>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            { backgroundColor: colors.card },
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: width - 48,
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingContainer: {
    width: 80,
    height: 80,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  fullButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  flowerContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowerImage: {
    width: 120,
    height: 120,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    borderRadius: 3,
  },
});
