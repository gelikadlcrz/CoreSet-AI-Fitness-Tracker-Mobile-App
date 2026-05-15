import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';

import { usePoseDetection } from 'react-native-mediapipe/src/poseDetection';
import { MediapipeCamera } from 'react-native-mediapipe/src/shared/mediapipeCamera';

import {
  Delegate,
  RunningMode,
} from 'react-native-mediapipe/src/shared/types';

const MODEL_NAME = 'pose_landmarker_full.task';

type PoseLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

type OverlayPoint = {
  x: number;
  y: number;
  visible: boolean;
};

const POSE_CONNECTIONS: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
];

function isLandmarkArray(value: any): value is PoseLandmark[] {
  return (
    Array.isArray(value) &&
    value.length >= 25 &&
    typeof value[0]?.x === 'number' &&
    typeof value[0]?.y === 'number'
  );
}

function extractLandmarks(result: any): PoseLandmark[] {
  const candidates = [
    result?.results?.[0]?.landmarks?.[0],
    result?.results?.[0]?.poseLandmarks?.[0],
    result?.landmarks?.[0],
    result?.poseLandmarks?.[0],
    result?.landmarks,
    result?.poseLandmarks,
  ];

  for (const item of candidates) {
    if (isLandmarkArray(item)) {
      return item;
    }
  }

  return [];
}

function getPoseQuality(landmarks: PoseLandmark[]) {
  if (landmarks.length !== 33) {
    return {
      usable: false,
      visibleCount: 0,
      message: 'No pose detected',
    };
  }

  const visibleCount = landmarks.filter((point) => {
    const visibility = point.visibility ?? 1;
    const presence = point.presence ?? 1;

    return visibility >= 0.5 && presence >= 0.5;
  }).length;

  const requiredJoints = [
    11, // left shoulder
    12, // right shoulder
    13, // left elbow
    14, // right elbow
    15, // left wrist
    16, // right wrist
    23, // left hip
    24, // right hip
  ];

  const requiredVisible = requiredJoints.every((index) => {
    const point = landmarks[index];

    if (!point) {
      return false;
    }

    const visibility = point.visibility ?? 0;
    const presence = point.presence ?? 0;

    return visibility >= 0.5 && presence >= 0.5;
  });

  return {
    usable: visibleCount >= 20 && requiredVisible,
    visibleCount,
    message:
      visibleCount >= 20 && requiredVisible
        ? 'Pose usable'
        : `Pose detected but incomplete: ${visibleCount}/33 reliable`,
  };
}

function toOverlayPoints(
  landmarks: PoseLandmark[],
  width: number,
  height: number
): OverlayPoint[] {
  return landmarks.map((point) => {
    const visibility = point.visibility ?? 1;
    const presence = point.presence ?? 1;

    return {
      x: point.x * width,
      y: point.y * height,
      visible: visibility >= 0.35 && presence >= 0.35,
    };
  });
}

function SkeletonOverlay({
  landmarks,
  width,
  height,
}: {
  landmarks: PoseLandmark[];
  width: number;
  height: number;
}) {
  if (landmarks.length !== 33 || width <= 0 || height <= 0) {
    return null;
  }

  const points = toOverlayPoints(landmarks, width, height);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {POSE_CONNECTIONS.map(([startIndex, endIndex]) => {
        const start = points[startIndex];
        const end = points[endIndex];

        if (!start || !end || !start.visible || !end.visible) {
          return null;
        }

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        return (
          <View
            key={`${startIndex}-${endIndex}`}
            style={[
              styles.bone,
              {
                left: start.x,
                top: start.y,
                width: length,
                transform: [
                  { translateY: -1 },
                  { rotateZ: `${angle}rad` },
                ],
              },
            ]}
          />
        );
      })}

      {points.map((point, index) => {
        if (!point.visible) {
          return null;
        }

        return (
          <View
            key={index}
            style={[
              styles.joint,
              {
                left: point.x - 4,
                top: point.y - 4,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function MediaPipeTestScreen() {
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [status, setStatus] = useState('Starting MediaPipe camera...');
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [resultCount, setResultCount] = useState(0);

  const [viewSize, setViewSize] = useState({
    width: 0,
    height: 0,
  });

  const callbacks = useMemo(
    () => ({
      onResults: (result: any) => {
        setResultCount((prev) => prev + 1);

        const detectedLandmarks = extractLandmarks(result);
        const quality = getPoseQuality(detectedLandmarks);

        setLandmarks(detectedLandmarks);
        setLandmarkCount(detectedLandmarks.length);
        setVisibleCount(quality.visibleCount);
        setStatus(quality.message);

        if (detectedLandmarks.length > 0) {
          console.log('MediaPipe landmark count:', detectedLandmarks.length);
          console.log('Reliable landmarks:', quality.visibleCount);
          console.log('Sample nose:', detectedLandmarks[0]);
          console.log('Sample left hip:', detectedLandmarks[23]);
        }
      },

      onError: (error: any) => {
        console.log('MediaPipe test error:', error);
        setStatus(`MediaPipe error: ${String(error?.message ?? error)}`);
      },
    }),
    []
  );

  const poseDetection = usePoseDetection(
    callbacks,
    RunningMode.LIVE_STREAM,
    MODEL_NAME,
    {
      numPoses: 1,
      delegate: Delegate.CPU,
      minPoseDetectionConfidence: 0.3,
      minPosePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
      shouldOutputSegmentationMasks: false,
    }
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setViewSize({
      width,
      height,
    });
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <MediapipeCamera
        style={StyleSheet.absoluteFill}
        solution={poseDetection}
        activeCamera="front"
        resizeMode="cover"
      />

      <SkeletonOverlay
        landmarks={landmarks}
        width={viewSize.width}
        height={viewSize.height}
      />

      <View style={styles.panel}>
        <Text style={styles.title}>MediaPipe Pose Test</Text>
        <Text style={styles.text}>{status}</Text>
        <Text style={styles.text}>Results received: {resultCount}</Text>
        <Text style={styles.text}>Landmarks: {landmarkCount}</Text>
        <Text style={styles.text}>Reliable: {visibleCount}/33</Text>
        <Text style={styles.smallText}>Model: {MODEL_NAME}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  panel: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  text: {
    color: '#fff',
    fontSize: 14,
  },

  smallText: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 8,
  },

  joint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF99',
  },

  bone: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#00FF99',
    transformOrigin: '0px 1.5px',
  },
});