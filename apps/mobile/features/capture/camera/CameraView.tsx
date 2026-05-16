/**
 * CameraView (capture/camera/CameraView.tsx)
 *
 * Main camera screen. Handles:
 *  - Camera permission flow
 *  - MediaPipe camera setup
 *  - RepOverlay rendering
 *  - SkeletonOverlay rendering
 *  - Start / Stop / Reset controls
 */

import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCameraPermission } from 'react-native-vision-camera';

import { MediapipeCamera } from 'react-native-mediapipe/src/shared/mediapipeCamera';

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
        <Text style={styles.permText}>Camera permission required.</Text>

        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!state.isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00E5FF" size="large" />
        <Text style={[styles.permText, { marginTop: 16 }]}>
          Loading AI model…
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

      <SkeletonOverlay
        landmarks={state.landmarks}
        frameSize={state.frameSize}
        mirror
      />

      <RepOverlay
        repCount={state.repCount}
        exerciseClass={state.exerciseClass}
        classConfidence={state.classConfidence}
        isRunning={state.isRunning}
        fps={state.fps}
      />

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
    minWidth: 110,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },

  mainBtn: {
    backgroundColor: '#00E5FF',
  },

  stopBtn: {
    backgroundColor: '#FF3B30',
  },

  ctrlBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },

  mainBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});