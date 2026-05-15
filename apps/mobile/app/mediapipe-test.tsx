import React from 'react';
import { View, StyleSheet } from 'react-native';

import MediaPipeTestScreen from '../features/mediapipe-test/MediaPipeTestScreen';

export default function Page() {
  return (
    <View style={styles.container}>
      <MediaPipeTestScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});