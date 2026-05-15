/**
 * app/capture/index.tsx
 *
 * Expo Router screen entry point for the capture tab.
 * Renders the CameraView with a safe-area wrapper.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CameraView from '../../src/features/capture/camera/CameraView';

export default function CaptureScreen() {
  return (
    <View style={styles.root}>
      <CameraView />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
});