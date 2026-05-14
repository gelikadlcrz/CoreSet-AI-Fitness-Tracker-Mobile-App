/**
 * CameraView (capture/camera/CameraView.tsx)
 *
 * Main camera screen.  Handles:
 *  - Camera permission flow
 *  - react-native-vision-camera setup
 *  - Wiring useCapture frame processor
 *  - RepOverlay rendering
 *  - Start / Stop / Reset controls
 */

import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCameraFormat,
} from 'react-native-vision-camera';
import { COLORS } from '@/shared/theme';

import { useCapture } from '../hooks/useCapture';
import { RepOverlay } from '../overlays/RepOverlay';

export default function CameraView() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [
    { fps: 30 },
    { videoResolution: { width: 640, height: 480 } },
  ]);

  // Use the actual fps the format supports, not hardcoded 30
  const targetFps = format?.maxFps ? Math.min(30, format.maxFps) : undefined;

  const { state, frameProcessor, startCapture, stopCapture, resetReps } = useCapture();

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Show error alert
  useEffect(() => {
    if (state.error) {
      Alert.alert('Capture Error', state.error);
    }
  }, [state.error]);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera permission required.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>No camera device found.</Text>
      </View>
    );
  }

  if (!state.isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00E5FF" size="large" />
        <Text style={[styles.permText, { marginTop: 16 }]}>Loading AI model…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Camera feed */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        format={format}
        fps={targetFps}
        photo={false}
        video={false}
        audio={false}
        videoStabilizationMode="auto"
      />

      {/* Overlay — reps, class, FPS */}
      <RepOverlay
        repCount={state.repCount}
        exerciseClass={state.exerciseClass}
        classConfidence={state.classConfidence}
        isRunning={state.isRunning}
        fps={state.fps}
      />

      {/* Bottom controls */}
      <View style={styles.controls}>
        <Pressable
          style={[styles.ctrlBtn, styles.resetBtn]}
          onPress={resetReps}
        >
          <Text style={styles.ctrlBtnText}>RESET</Text>
        </Pressable>

        <Pressable
          style={[
            styles.ctrlBtn,
            styles.mainBtn,
            state.isRunning && styles.stopBtn,
          ]}
          onPress={state.isRunning ? stopCapture : startCapture}
        >
          <Text style={styles.mainBtnText}>
            {state.isRunning ? 'STOP' : 'START'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permText: {
    color: '#FFFFFF99',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  ctrlBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mainBtn: {
    flex: 1,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  stopBtn: {
    backgroundColor: '#FF4444',
    shadowColor: '#FF4444',
  },
  ctrlBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
  },
  mainBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 2,
  },
});