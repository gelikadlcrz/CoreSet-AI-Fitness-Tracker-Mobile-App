import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MediaPipeTestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediaPipe Test Disabled</Text>
      <Text style={styles.text}>
        The app is stable. Next step is to rebuild with the MediaPipe native module before importing it here.
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
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },
});