/**
 * Pose normalisation for ST-GCN input.
 *
 * Mobile inference should match the training preprocessing contract:
 *  - 14 angle-based channels
 *  - 33 graph vertices (BlazePose joints)
 *  - for each angle triplet [i, j, k], the computed angle is placed on the
 *    vertex joint j for that channel, while the remaining vertices stay 0.
 *
 * Per-frame output layout is channel-major:
 *   index = channel * NUM_JOINTS + vertex
 * Shape per frame: [C, V] = [14, 33]
 */

import { NUM_JOINTS } from '../graph/adjacencyMatrix';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export const ANGLE_FEATURE_DIM = 14;
export const FRAME_FEATURES = ANGLE_FEATURE_DIM * NUM_JOINTS;

// [proximal, vertex, distal]
const ANGLE_TRIPLETS: [number, number, number][] = [
  [11, 23, 25],
  [12, 24, 26],
  [11, 13, 15],
  [13, 15, 17],
  [12, 14, 16],
  [14, 16, 18],
  [23, 25, 27],
  [25, 27, 29],
  [24, 26, 28],
  [26, 28, 30],
  [11, 23, 24],
  [12, 24, 23],
  [13, 11, 23],
  [14, 12, 24],
];

function angleBetween(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const normBa = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const normBc = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
  if (normBa < 1e-9 || normBc < 1e-9) return 0.0;

  const cosTheta = (ba.x * bc.x + ba.y * bc.y + ba.z * bc.z) / (normBa * normBc);
  return Math.acos(Math.max(-1, Math.min(1, cosTheta)));
}

/**
 * Compute per-frame graph features of shape [14 * 33].
 */
export function normalisePose(rawLandmarks: Landmark3D[]): Float32Array {
  if (rawLandmarks.length !== NUM_JOINTS) {
    throw new Error(`Expected ${NUM_JOINTS} landmarks, got ${rawLandmarks.length}`);
  }

  const features = new Float32Array(FRAME_FEATURES);

  for (let channel = 0; channel < ANGLE_TRIPLETS.length; channel++) {
    const [i, j, k] = ANGLE_TRIPLETS[channel];
    const a = rawLandmarks[i];
    const b = rawLandmarks[j];
    const c = rawLandmarks[k];

    let angle = 0.0;
    if (!isNaN(a.x) && !isNaN(b.x) && !isNaN(c.x)) {
      angle = angleBetween(a, b, c);
    }

    const index = channel * NUM_JOINTS + j;
    features[index] = angle;
  }

  return features;
}
