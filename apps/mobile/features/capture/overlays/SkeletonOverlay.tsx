import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

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

function isUsableLandmark(lm: Landmark3D | undefined) {
  return (
    Number.isFinite(lm?.x) &&
    Number.isFinite(lm?.y) &&
    (lm?.visibility ?? 0) > 0.35
  );
}

function mapPoint(x: number, y: number) {
  /**
   * This is the same mapping that fixed the MediaPipe test screen.
   * MediaPipe outputs landscape-oriented normalized coordinates, while
   * the phone preview is displayed in portrait.
   */
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
            { translateY: -1.5 },
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
    .map((lm, index) => ({ lm, index }))
    .filter(({ lm }) => isUsableLandmark(lm));

  if (visible.length < 12) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BONES.map(([a, b], idx) => {
        const p1 = landmarks[a];
        const p2 = landmarks[b];

        if (!isUsableLandmark(p1) || !isUsableLandmark(p2)) {
          return null;
        }

        const m1 = mapPoint(p1.x, p1.y);
        const m2 = mapPoint(p2.x, p2.y);

        return (
          <Bone
            key={`bone-${idx}`}
            x1={m1.x}
            y1={m1.y}
            x2={m2.x}
            y2={m2.y}
          />
        );
      })}

      {visible.map(({ lm, index }) => {
        const point = mapPoint(lm.x, lm.y);

        return (
          <View
            key={`joint-${index}`}
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

const styles = StyleSheet.create({
  bone: {
    position: 'absolute',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 229, 255, 0.9)',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    transformOrigin: '0px 1.5px',
  },

  joint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#76FF03',
    shadowColor: '#76FF03',
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
});