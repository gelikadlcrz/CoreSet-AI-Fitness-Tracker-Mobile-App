export type PoseLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

export type OverlayPoint = {
  x: number;
  y: number;
  visible: boolean;
};

export const POSE_CONNECTIONS: Array<[number, number]> = [
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

export function isLandmarkArray(value: any): value is PoseLandmark[] {
  return (
    Array.isArray(value) &&
    value.length >= 25 &&
    typeof value[0]?.x === 'number' &&
    typeof value[0]?.y === 'number'
  );
}

export function extractLandmarks(result: any): PoseLandmark[] {
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

export function getPoseQuality(landmarks: PoseLandmark[]) {
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
    11,
    12,
    13,
    14,
    15,
    16,
    23,
    24,
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

export function toOverlayPoints(
  landmarks: PoseLandmark[],
  width: number,
  height: number
): OverlayPoint[] {
  return landmarks.map((point) => {
    const visibility = point.visibility ?? 1;
    const presence = point.presence ?? 1;

    const rotatedX = 1 - point.y;
    const rotatedY = point.x;

    return {
      x: rotatedX * width,
      y: rotatedY * height,
      visible: visibility >= 0.35 && presence >= 0.35,
    };
  });
}