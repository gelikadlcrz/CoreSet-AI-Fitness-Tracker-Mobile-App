import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MediapipeCamera, usePoseDetection } from 'react-native-mediapipe';

export default function MediaPipeTestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediaPipe Import Test</Text>
      <Text style={styles.text}>
        MediaPipe imported successfully.
      </Text>
      <Text style={styles.small}>
        Camera not enabled yet.
      </Text>
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
  small: {
    color: '#aaa',
    textAlign: 'center',
  },
});