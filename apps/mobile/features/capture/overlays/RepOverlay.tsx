/**
 * RepOverlay
 *
 * Renders the real-time rep count and exercise classification over the camera.
 * Uses Reanimated for smooth, jank-free animations on the UI thread.
 */

// @ts-ignore: Workaround for module resolution in monorepo workspace
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { ExerciseClass } from '../inference/STGCNRunner';
import { COLORS } from '@/shared/theme/colors';

const { width, height } = Dimensions.get('window');

interface RepOverlayProps {
  repCount: number;
  exerciseClass: ExerciseClass | null;
  classConfidence: number;
  isRunning: boolean;
  fps: number;
}

const CLASS_COLORS: Record<ExerciseClass, string> = {
  squat:      '#00E5FF',
  pushup:     '#76FF03',
  benchpress: '#FF6D00',
  pullup:     '#E040FB',
};

const CLASS_LABELS: Record<ExerciseClass, string> = {
  squat:      'SQUAT',
  pushup:     'PUSH-UP',
  benchpress: 'BENCH PRESS',
  pullup:     'PULL-UP',
};

export function RepOverlay({
  repCount,
  exerciseClass,
  classConfidence,
  isRunning,
  fps,
}: RepOverlayProps) {
  const prevRepCount = useRef(repCount);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Pulse animation on rep
  useEffect(() => {
    if (repCount > prevRepCount.current) {
      scale.value = withSequence(
        withSpring(1.4, { damping: 4, stiffness: 300 }),
        withSpring(1.0, { damping: 10, stiffness: 200 }),
      );
      opacity.value = withSequence(
        withTiming(0.6, { duration: 80 }),
        withTiming(1.0, { duration: 200 }),
      );
    }
    prevRepCount.current = repCount;
  }, [repCount]);

  const repStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const accentColor = exerciseClass ? CLASS_COLORS[exerciseClass] : COLORS.text;
  const confidencePct = Math.round(classConfidence * 100);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top bar — exercise class + FPS */}
      <View style={styles.topBar}>
        <View style={[styles.classBadge, { borderColor: accentColor }]}>
          <Text style={[styles.classText, { color: accentColor }]}>
            {exerciseClass ? CLASS_LABELS[exerciseClass] : '—'}
          </Text>
          {exerciseClass && (
            <Text style={[styles.confidenceText, { color: accentColor }]}>
              {confidencePct}%
            </Text>
          )}
        </View>
        <View style={styles.fpsBadge}>
          <Text style={styles.fpsText}>{fps} FPS</Text>
        </View>
      </View>

      {/* Centre — large rep counter */}
      {isRunning && (
        <View style={styles.repContainer}>
          <Animated.Text style={[styles.repCount, { color: accentColor }, repStyle]}>
            {repCount}
          </Animated.Text>
          <Text style={styles.repLabel}>REPS</Text>
        </View>
      )}

      {/* Not running */}
      {!isRunning && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Tap START to begin</Text>
        </View>
      )}

      {/* Corner accent lines */}
      <CornerAccent color={accentColor} position="top-left" />
      <CornerAccent color={accentColor} position="top-right" />
      <CornerAccent color={accentColor} position="bottom-left" />
      <CornerAccent color={accentColor} position="bottom-right" />
    </View>
  );
}

function CornerAccent({
  color,
  position,
}: {
  color: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('left');

  return (
    <View
      style={[
        styles.corner,
        isTop ? { top: 16 } : { bottom: 16 },
        isLeft ? { left: 16 } : { right: 16 },
      ]}
    >
      <View style={[styles.cornerH, { backgroundColor: color }]} />
      <View style={[styles.cornerV, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  classBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  classText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  fpsBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fpsText: {
    color: '#FFFFFF88',
    fontSize: 12,
    fontWeight: '500',
  },
  repContainer: {
    alignItems: 'center',
  },
  repCount: {
    fontSize: 96,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    lineHeight: 100,
  },
  repLabel: {
    color: '#FFFFFFAA',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: -8,
  },
  hintContainer: {
    alignItems: 'center',
  },
  hintText: {
    color: '#FFFFFF66',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  cornerH: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    width: 24,
  },
  cornerV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 24,
  },
});