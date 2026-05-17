import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { COLORS } from '../../../shared/theme';
import type { Landmark3D } from '../../../ml/preprocessing/normalizePose';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BONES: [number, number][] = [
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

interface SkeletonOverlayProps {
  landmarks: Landmark3D[] | null;
  frameSize: { width: number; height: number } | null;
  mirror?: boolean;
}

function isUsableLandmark(landmark: Landmark3D | undefined) {
  return (
    Number.isFinite(landmark?.x) &&
    Number.isFinite(landmark?.y) &&
    (landmark?.visibility ?? 0) > 0.35
  );
}

function mapPoint(x: number, y: number) {
  const rotatedX = 1 - y;
  const rotatedY = x;

  return {
    x: rotatedX * SCREEN_WIDTH,
    y: rotatedY * SCREEN_HEIGHT,
  };
}

function Bone({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1);

  return (
    <View
      style={[
        styles.bone,
        {
          left: x1,
          top: y1,
          width: length,
          transform: [
            { translateY: -1 },
            { rotateZ: `${angle}rad` },
          ],
        },
      ]}
    />
  );
}

export function SkeletonOverlay({
  landmarks,
  frameSize,
}: SkeletonOverlayProps) {
  if (!landmarks || !frameSize || landmarks.length !== 33) {
    return null;
  }

  const visible = landmarks
    .map((landmark, index) => ({ landmark, index }))
    .filter(({ landmark }) => isUsableLandmark(landmark));

  if (visible.length < 12) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BONES.map(([startIndex, endIndex]) => {
        const start = landmarks[startIndex];
        const end = landmarks[endIndex];

        if (!isUsableLandmark(start) || !isUsableLandmark(end)) {
          return null;
        }

        const startPoint = mapPoint(start.x, start.y);
        const endPoint = mapPoint(end.x, end.y);

        return (
          <Bone
            key={`${startIndex}-${endIndex}`}
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
          />
        );
      })}

      {visible.map(({ landmark, index }) => {
        const point = mapPoint(landmark.x, landmark.y);

        return (
          <View
            key={`joint-${index}`}
            style={[
              styles.joint,
              {
                left: point.x - 3.5,
                top: point.y - 3.5,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    position: 'absolute',
    height: 2,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    opacity: 0.95,
    transformOrigin: '0px 1px',
  },

  joint: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    opacity: 0.95,
  },
});