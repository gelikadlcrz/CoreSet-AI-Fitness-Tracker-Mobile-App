import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

  // fallback support for old names, just in case
  benchpress: 'Bench Press',
  pullup: 'Pull-up',
  pushup: 'Push-up',
};

function formatExerciseLabel(exerciseClass: ExerciseClass | null): string {
  if (!exerciseClass) {
    return 'Detecting...';
  }

  return EXERCISE_LABELS[exerciseClass] ?? exerciseClass;
}

function formatConfidence(confidence: number): string {
  if (!Number.isFinite(confidence)) {
    return '0%';
  }

  return `${Math.round(confidence * 100)}%`;
}

export function RepOverlay({
  repCount,
  exerciseClass,
  classConfidence,
  isRunning,
  fps,
}: RepOverlayProps) {
  const label = formatExerciseLabel(exerciseClass);

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>REPS</Text>
        <Text style={styles.repCount}>{repCount}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>EXERCISE</Text>
        <Text style={styles.exercise}>{label}</Text>

        <Text style={styles.meta}>
          Confidence: {formatConfidence(classConfidence)}
        </Text>

        <Text style={styles.meta}>
          Status: {isRunning ? 'Running' : 'Paused'}
        </Text>

        <Text style={styles.meta}>FPS: {fps}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    alignItems: 'flex-start',
  },

  card: {
    minWidth: 180,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },

  label: {
    color: '#FFFFFF99',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  repCount: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginVertical: 10,
  },

  exercise: {
    color: '#00E5FF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },

  meta: {
    color: '#FFFFFFCC',
    fontSize: 12,
    marginTop: 5,
  },
});