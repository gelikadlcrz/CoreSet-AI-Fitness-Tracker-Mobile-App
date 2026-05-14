import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import type { RawLandmarks } from '../pose/BlazePoseDetector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODEL_SIZE = 256;

const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [27, 31],
  [24, 26], [26, 28], [28, 30], [28, 32],
];

interface SkeletonOverlayProps {
  landmarks: RawLandmarks | null;
  mirror?: boolean;
}

function mapPoint(x: number, y: number, mirror: boolean) {
  const px = (x / MODEL_SIZE) * SCREEN_WIDTH;
  const py = (y / MODEL_SIZE) * SCREEN_HEIGHT;
  return {
    x: mirror ? SCREEN_WIDTH - px : px,
    y: py,
  };
}

function Bone({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <View
      style={[
        styles.bone,
        {
          width: length,
          left: midX - length / 2,
          top: midY - 1.5,
          transform: [{ rotateZ: `${angle}rad` }],
        },
      ]}
    />
  );
}

export function SkeletonOverlay({ landmarks, mirror = true }: SkeletonOverlayProps) {
  if (!landmarks || landmarks.length === 0) return null;

  const visible = landmarks
    .map((lm, index) => ({ lm, index }))
    .filter(({ lm }) => Number.isFinite(lm.x) && Number.isFinite(lm.y) && (lm.visibility ?? 0) > 0.1);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BONES.map(([a, b], idx) => {
        const p1 = landmarks[a];
        const p2 = landmarks[b];
        if (!p1 || !p2) return null;
        if (!Number.isFinite(p1.x) || !Number.isFinite(p1.y) || !Number.isFinite(p2.x) || !Number.isFinite(p2.y)) return null;
        if ((p1.visibility ?? 0) <= 0.1 || (p2.visibility ?? 0) <= 0.1) return null;

        const m1 = mapPoint(p1.x, p1.y, mirror);
        const m2 = mapPoint(p2.x, p2.y, mirror);
        return <Bone key={`bone-${idx}`} x1={m1.x} y1={m1.y} x2={m2.x} y2={m2.y} />;
      })}

      {visible.map(({ lm, index }) => {
        const p = mapPoint(lm.x, lm.y, mirror);
        return <View key={`joint-${index}`} style={[styles.joint, { left: p.x - 4, top: p.y - 4 }]} />;
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
