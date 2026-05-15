import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';

const poseModel = require('../../assets/models/pose_landmarker_full.task');

export default function MediaPipeTestScreen() {
  const [status, setStatus] = useState('Loading model asset...');

  useEffect(() => {
    async function loadAsset() {
      try {
        const asset = Asset.fromModule(poseModel);
        await asset.downloadAsync();

        setStatus(
          `Asset loaded\nlocalUri: ${asset.localUri ?? 'none'}\nuri: ${asset.uri ?? 'none'}`
        );

        console.log('Pose model asset:', {
          localUri: asset.localUri,
          uri: asset.uri,
          name: asset.name,
          type: asset.type,
        });
      } catch (error: any) {
        console.log('Pose model asset error:', error);
        setStatus(`Asset error: ${String(error?.message ?? error)}`);
      }
    }

    loadAsset();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediaPipe Asset Test</Text>
      <Text style={styles.text}>{status}</Text>
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