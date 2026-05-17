import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermission } from 'react-native-vision-camera';
import { MediapipeCamera } from 'react-native-mediapipe/src/shared/mediapipeCamera';

import { COLORS } from '../../../shared/theme';

import { useCapture } from '../hooks/useCapture';
import { RepOverlay } from '../overlays/RepOverlay';
import { SkeletonOverlay } from '../overlays/SkeletonOverlay';

export default function CameraView() {
  const { hasPermission, requestPermission } = useCameraPermission();

  const {
    state,
    mediaPipeSolution,
    startCapture,
    stopCapture,
    resetReps,
  } = useCapture();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (state.error) {
      Alert.alert('Capture Error', state.error);
    }
  }, [state.error]);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={34} color={COLORS.accent} />
        </View>

        <Text style={styles.permissionTitle}>Camera Access Needed</Text>

        <Text style={styles.permissionText}>
          CoreSet uses your camera to track your exercise form and count reps
          on-device.
        </Text>

        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!state.isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accent} size="large" />

        <Text style={styles.loadingTitle}>Preparing AI Capture</Text>

        <Text style={styles.permissionText}>
          Loading pose tracking and exercise recognition models…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MediapipeCamera
        style={StyleSheet.absoluteFill}
        solution={mediaPipeSolution}
        activeCamera="front"
        resizeMode="cover"
      />

      <View pointerEvents="none" style={styles.cameraShade} />

      <SkeletonOverlay
        landmarks={state.landmarks}
        frameSize={state.frameSize}
        mirror
      />

      <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
        <View pointerEvents="none" style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>LIVE CAPTURE</Text>
            <Text style={styles.title}>CoreSet AI</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              state.isRunning ? styles.statusRunning : styles.statusPaused,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                state.isRunning ? styles.dotRunning : styles.dotPaused,
              ]}
            />

            <Text style={styles.statusText}>
              {state.isRunning ? 'Tracking' : 'Ready'}
            </Text>
          </View>
        </View>

        <RepOverlay
          repCount={state.repCount}
          exerciseClass={state.exerciseClass}
          classConfidence={state.classConfidence}
          isRunning={state.isRunning}
          fps={state.fps}
          motionScore={state.motionScore}
          motionThreshold={state.motionThreshold}
        />

        {!state.isRunning && (
          <View pointerEvents="none" style={styles.instructionCard}>
            <View style={styles.instructionIcon}>
              <Ionicons name="body-outline" size={18} color={COLORS.accent} />
            </View>

            <View style={styles.instructionCopy}>
              <Text style={styles.instructionTitle}>Before you start</Text>

              <Text style={styles.instructionText}>
                Keep your full body visible. Move slowly and complete each rep
                fully for better tracking.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.controls}>
          <Pressable
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetReps}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.text} />
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>

          <Pressable
            style={[
              styles.controlButton,
              styles.mainButton,
              state.isRunning && styles.stopButton,
            ]}
            onPress={state.isRunning ? stopCapture : startCapture}
          >
            <Ionicons
              name={state.isRunning ? 'stop' : 'play'}
              size={18}
              color={state.isRunning ? COLORS.text : '#000'}
            />

            <Text
              style={[
                styles.mainButtonText,
                state.isRunning && styles.stopButtonText,
              ]}
            >
              {state.isRunning ? 'Stop' : 'Start'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },

  safeArea: {
    flex: 1,
  },

  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },

  permissionIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(232, 255, 42, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232, 255, 42, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  permissionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 10,
  },

  loadingTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },

  permissionText: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 300,
  },

  permissionButton: {
    marginTop: 24,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
  },

  permissionButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  header: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 13, 13, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexShrink: 1,
    paddingRight: 12,
  },

  eyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 2,
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusRunning: {
    backgroundColor: 'rgba(24, 209, 47, 0.14)',
    borderColor: 'rgba(24, 209, 47, 0.35)',
  },

  statusPaused: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  dotRunning: {
    backgroundColor: COLORS.success,
  },

  dotPaused: {
    backgroundColor: COLORS.textMuted,
  },

  statusText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },

  instructionCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 128,
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(13, 13, 13, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  instructionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(232, 255, 42, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  instructionCopy: {
    flex: 1,
  },

  instructionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },

  instructionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },

  controls: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },

  controlButton: {
    height: 58,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetButton: {
    flex: 0.9,
    backgroundColor: 'rgba(13, 13, 13, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },

  mainButton: {
    flex: 1.25,
    backgroundColor: COLORS.accent,
  },

  stopButton: {
    backgroundColor: COLORS.danger,
  },

  resetButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },

  mainButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  stopButtonText: {
    color: COLORS.text,
  },
});