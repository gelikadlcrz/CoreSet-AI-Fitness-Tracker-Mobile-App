import React, { useEffect, useMemo, useRef } from 'react';
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
  motionScore: number;
  motionThreshold: number;
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

const TRACK_HEIGHT = 156;
const VISUAL_HEADROOM = 1.25;

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

function getMotionRatio(score: number, threshold: number) {
  if (!Number.isFinite(score) || !Number.isFinite(threshold) || threshold <= 0) {
    return 0;
  }

  return score / threshold;
}

export function RepOverlay({
  repCount,
  exerciseClass,
  classConfidence,
  isRunning,
  fps,
  motionScore,
  motionThreshold,
}: RepOverlayProps) {
  const confidencePercent = getConfidencePercent(classConfidence);
  const exerciseLabel = formatExerciseLabel(exerciseClass);

  const repScale = useRef(new Animated.Value(1)).current;
  const meterAnim = useRef(new Animated.Value(0)).current;
  const previousRepRef = useRef(repCount);

  const motionRatio = useMemo(
    () => getMotionRatio(motionScore, motionThreshold),
    [motionScore, motionThreshold]
  );

  const clampedVisualRatio = Math.max(0, Math.min(VISUAL_HEADROOM, motionRatio));
  const fillHeight = (clampedVisualRatio / VISUAL_HEADROOM) * TRACK_HEIGHT;

  const thresholdFillHeight = TRACK_HEIGHT / VISUAL_HEADROOM;
  const countZoneHeight = TRACK_HEIGHT - thresholdFillHeight;
  const reachedCountZone = motionRatio >= 1;

  useEffect(() => {
    Animated.timing(meterAnim, {
      toValue: fillHeight,
      duration: 140,
      useNativeDriver: false,
    }).start();
  }, [fillHeight, meterAnim]);

  useEffect(() => {
    if (repCount > previousRepRef.current) {
      Animated.sequence([
        Animated.spring(repScale, {
          toValue: 1.10,
          useNativeDriver: true,
          friction: 5,
          tension: 120,
        }),
        Animated.spring(repScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 90,
        }),
      ]).start();
    }

    previousRepRef.current = repCount;
  }, [repCount, repScale]);

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.card}>
        <View style={styles.leftContent}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.label}>REPS</Text>

              <Animated.Text
                style={[
                  styles.repCount,
                  {
                    transform: [{ scale: repScale }],
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

        <View style={styles.meterSection}>
          <Text style={styles.meterLabel}>REP DRIVE</Text>

          <View style={styles.meterTrack}>
            <View
              style={[
                styles.countZone,
                {
                  height: countZoneHeight,
                },
              ]}
            />

            <View
              style={[
                styles.targetLine,
                {
                  bottom: thresholdFillHeight,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.meterFill,
                reachedCountZone && styles.meterFillActive,
                {
                  height: meterAnim,
                },
              ]}
            />

            <View style={styles.trackBorder} />
          </View>

          <View
            style={[
              styles.zoneBadge,
              reachedCountZone ? styles.zoneBadgeReady : styles.zoneBadgeWaiting,
            ]}
          >
            <Text style={styles.zoneBadgeText}>
              {reachedCountZone ? 'READY' : 'BUILD'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 106,
    left: 16,
    right: 16,
    alignItems: 'flex-start',
  },

  card: {
    width: 262,
    minHeight: 250,
    padding: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 13, 13, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
  },

  leftContent: {
    flex: 1,
    paddingRight: 12,
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
    letterSpacing: 1.3,
  },

  repCount: {
    color: COLORS.text,
    fontSize: 50,
    fontWeight: '900',
    lineHeight: 56,
    marginTop: 2,
  },

  runningBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
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
    marginVertical: 12,
  },

  predictionRow: {
    gap: 4,
  },

  exercise: {
    color: COLORS.accent,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
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
    color: COLORS.text,
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

  meterSection: {
    width: 58,
    alignItems: 'center',
  },

  meterLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },

  meterTrack: {
    width: 34,
    height: TRACK_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },

  countZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(232, 255, 42, 0.10)',
  },

  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(232, 255, 42, 0.90)',
  },

  meterFill: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 18,
  },

  meterFillActive: {
    backgroundColor: COLORS.accent,
  },

  trackBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
  },

  zoneBadge: {
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  zoneBadgeWaiting: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },

  zoneBadgeReady: {
    backgroundColor: 'rgba(232, 255, 42, 0.14)',
    borderColor: 'rgba(232, 255, 42, 0.35)',
  },

  zoneBadgeText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});