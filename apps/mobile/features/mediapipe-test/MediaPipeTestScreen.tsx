import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePoseDetection } from 'react-native-mediapipe/src/poseDetection';

import {
  Delegate,
  RunningMode,
} from 'react-native-mediapipe/src/shared/types';
const MODEL_NAME = 'pose_landmarker_full.task';

export default function MediaPipeTestScreen() {
  const [status, setStatus] = useState('Creating pose detector...');

  const callbacks = useMemo(
    () => ({
      onResults: (result: any) => {
        console.log('MediaPipe resultß:', result);
        setStatus('Detector returned result.');
      },
      onError: (error: any) => {
        console.log('MediaPipe test error:', error);
        setStatus(`Error: ${String(error?.message ?? error)}`);
      },
    }),
    []
  );

  usePoseDetection(
    callbacks,
    RunningMode.LIVE_STREAM,
    MODEL_NAME,
    {
      numPoses: 1,
      delegate: Delegate.CPU,
    }
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediaPipe Hook Test</Text>
      <Text style={styles.text}>{status}</Text>
      <Text style={styles.smallText}>Model: {MODEL_NAME}</Text>
      <Text style={styles.smallText}>Camera not attached yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  smallText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
});