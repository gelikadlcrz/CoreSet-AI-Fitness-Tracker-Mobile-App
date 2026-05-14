/**
 * Pose normalisation for ST-GCN input.
 *
 * Matches coreset_dataset.py exactly:
 *   - 14 specific joint-angle triplets (ANGLE_TRIPLETS)
 *   - Each angle placed at vertex joint j
 *   - Output shape: Float32Array [ANGLE_FEATURE_DIM=14]
 */

import { NUM_JOINTS } from '../graph/adjacencyMatrix';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export const ANGLE_FEATURE_DIM = 14;

// Matches ANGLE_TRIPLETS in coreset_dataset.py exactly
// [proximal, vertex, distal]
const ANGLE_TRIPLETS: [number, number, number][] = [
  // Trunk
  [11, 23, 25],  // left shoulder–hip–knee
  [12, 24, 26],  // right shoulder–hip–knee
  // Left arm
  [11, 13, 15],  // left shoulder–elbow–wrist
  [13, 15, 17],  // left elbow–wrist–pinky
  // Right arm
  [12, 14, 16],  // right shoulder–elbow–wrist
  [14, 16, 18],  // right elbow–wrist–pinky
  // Left leg
  [23, 25, 27],  // left hip–knee–ankle
  [25, 27, 29],  // left knee–ankle–heel
  // Right leg
  [24, 26, 28],  // right hip–knee–ankle
  [26, 28, 30],  // right knee–ankle–heel
  // Shoulder-hip
  [11, 23, 24],  // left shoulder–left hip–right hip
  [12, 24, 23],  // right shoulder–right hip–left hip
  // Elbow-shoulder-hip
  [13, 11, 23],  // left elbow–left shoulder–left hip
  [14, 12, 24],  // right elbow–right shoulder–right hip
];

function angleBetween(
  a: Landmark3D,
  b: Landmark3D,
  c: Landmark3D,
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const normBa = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const normBc = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (normBa < 1e-9 || normBc < 1e-9) return 0.0;

  const cosTheta = (ba.x * bc.x + ba.y * bc.y + ba.z * bc.z) / (normBa * normBc);
  return Math.acos(Math.max(-1, Math.min(1, cosTheta)));
}

/**
 * Compute 14 joint angles from 33 BlazePose landmarks.
 * Returns Float32Array of shape [ANGLE_FEATURE_DIM=14].
 * Matches compute_joint_angles() in coreset_dataset.py exactly.
 */
export function normalisePose(rawLandmarks: Landmark3D[]): Float32Array {
  if (rawLandmarks.length !== NUM_JOINTS) {
    throw new Error(`Expected ${NUM_JOINTS} landmarks, got ${rawLandmarks.length}`);
  }

  const angles = new Float32Array(ANGLE_FEATURE_DIM);

  for (let idx = 0; idx < ANGLE_TRIPLETS.length; idx++) {
    const [i, j, k] = ANGLE_TRIPLETS[idx];
    const a = rawLandmarks[i];
    const b = rawLandmarks[j];
    const c = rawLandmarks[k];

    // Use 0.0 for invisible joints (matches Python: no visibility check,
    // just uses coords directly — degenerate case returns 0.0)
    if (
      isNaN(a.x) || isNaN(b.x) || isNaN(c.x)
    ) {
      angles[idx] = 0.0;
    } else {
      angles[idx] = angleBetween(a, b, c);
    }
  }

  return angles;
}