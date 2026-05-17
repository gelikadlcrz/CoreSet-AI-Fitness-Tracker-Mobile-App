import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '../../../shared/theme';

import type { ExerciseClass } from '../inference/STGCNRunner';

interface RepOverlayProps {
  repCount: number;
  exerciseClass: ExerciseClass | null;
  classConfidence: number;
  isRunning: boolean;
  fps: number;
}

const EXERCISE_LABELS: Record<string, string> = {
  bench_press: 'Bench Press',
  pull_up: 'Pull-up',
  push_up: 'Push-up',
  squat: 'Squat',

  benchpress: 'Bench Press',
  pullup: 'Pull-up',
  pushup: 'Push-up',
};

function formatExerciseLabel(exerciseClass: ExerciseClass | null): string {
  if (!exerciseClass) {
    return 'Waiting for movement';
  }

  return EXERCISE_LABELS[exerciseClass] ?? exerciseClass;
}

function getConfidencePercent(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(confidence * 100)));
}

export function RepOverlay({
  repCount,
  exerciseClass,
  classConfidence,
  isRunning,
  fps,
}: RepOverlayProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const previousRepRef = useRef(repCount);

  const confidencePercent = getConfidencePercent(classConfidence);
  const exerciseLabel = formatExerciseLabel(exerciseClass);

  useEffect(() => {
    if (repCount > previousRepRef.current) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.12,
          useNativeDriver: true,
          friction: 5,
          tension: 120,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 90,
        }),
      ]).start();
    }

    previousRepRef.current = repCount;
  }, [repCount, scaleAnim]);

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.label}>REPS</Text>

            <Animated.Text
              style={[
                styles.repCount,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {repCount}
            </Animated.Text>
          </View>

          <View
            style={[
              styles.runningBadge,
              isRunning ? styles.badgeActive : styles.badgeIdle,
            ]}
          >
            <Text style={styles.runningBadgeText}>
              {isRunning ? 'LIVE' : 'IDLE'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.predictionRow}>
          <Text style={styles.label}>AI PREDICTION</Text>
          <Text style={styles.exercise}>{exerciseLabel}</Text>
        </View>

        <View style={styles.confidenceBlock}>
          <View style={styles.confidenceHeader}>
            <Text style={styles.metaLabel}>Confidence</Text>
            <Text style={styles.metaValue}>{confidencePercent}%</Text>
          </View>

          <View style={styles.confidenceTrack}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${confidencePercent}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.bottomStats}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>FPS</Text>
            <Text style={styles.statValue}>{fps}</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statLabel}>MODE</Text>
            <Text style={styles.statValue}>AI</Text>
          </View>
        </View>
      </View>

      {isRunning && repCount > 0 && (
        <View style={styles.repToast}>
          <Text style={styles.repToastText}>+1 rep detected</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 104,
    left: 18,
    right: 18,
    alignItems: 'flex-start',
  },

  card: {
    width: 214,
    padding: 16,
    borderRadius: 26,
    backgroundColor: 'rgba(13, 13, 13, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  repCount: {
    color: COLORS.text,
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -2,
    marginTop: 2,
  },

  runningBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  badgeActive: {
    backgroundColor: 'rgba(232, 255, 42, 0.13)',
    borderColor: 'rgba(232, 255, 42, 0.38)',
  },

  badgeIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },

  runningBadgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 13,
  },

  predictionRow: {
    gap: 3,
  },

  exercise: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  confidenceBlock: {
    marginTop: 14,
  },

  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  metaLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },

  metaValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },

  confidenceTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },

  confidenceFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },

  bottomStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  statPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },

  repToast: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(232, 255, 42, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(232, 255, 42, 0.36)',
  },

  repToastText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});