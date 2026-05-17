import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import CameraView from '../../features/capture/camera/CameraView';

export default function CaptureRoute() {
  const params = useLocalSearchParams<{
    mode?: string;
    routineId?: string;
  }>();

  console.log('Capture route params:', params);

  return <CameraView />;
}
