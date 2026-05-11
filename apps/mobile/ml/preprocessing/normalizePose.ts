/**
 * Pose normalisation for ST-GCN input.
 *
 * Pipeline:
 *  1. Translate so mid-hip is the origin (matches BlazePose world-coordinate convention).
 *  2. Scale by torso height to make the representation body-size invariant.
 *  3. Compute relative joint angles at every anatomical junction.
 *  4. Flatten into a [NUM_JOINTS × 3] feature vector per frame.
 *     Channel layout: [angle_x, angle_y, angle_z] for each joint.
 *
 * A NaN value indicates a low-visibility landmark (handled upstream by interpolation).
 */

import { NUM_JOINTS, BONE_EDGES } from '../graph/adjacencyMatrix';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

const VISIBILITY_THRESHOLD = 0.5;
const MID_HIP_L = 23;
const MID_HIP_R = 24;
const SHOULDER_L = 11;
const SHOULDER_R = 12;

/** Translate landmarks so mid-hip is the origin */
function centerOnMidHip(landmarks: Landmark3D[]): Landmark3D[] {
  const hipL = landmarks[MID_HIP_L];
  const hipR = landmarks[MID_HIP_R];

  // If either hip is invisible use the other, else average
  let ox = 0, oy = 0, oz = 0;
  if (
    (hipL.visibility ?? 1) >= VISIBILITY_THRESHOLD &&
    (hipR.visibility ?? 1) >= VISIBILITY_THRESHOLD
  ) {
    ox = (hipL.x + hipR.x) / 2;
    oy = (hipL.y + hipR.y) / 2;
    oz = (hipL.z + hipR.z) / 2;
  } else if ((hipL.visibility ?? 1) >= VISIBILITY_THRESHOLD) {
    ox = hipL.x; oy = hipL.y; oz = hipL.z;
  } else {
    ox = hipR.x; oy = hipR.y; oz = hipR.z;
  }

  return landmarks.map(lm => ({ ...lm, x: lm.x - ox, y: lm.y - oy, z: lm.z - oz }));
}

/** Compute torso height (mid-shoulder → mid-hip) for scale normalisation */
function torsoHeight(landmarks: Landmark3D[]): number {
  const sL = landmarks[SHOULDER_L];
  const sR = landmarks[SHOULDER_R];
  const midSx = (sL.x + sR.x) / 2;
  const midSy = (sL.y + sR.y) / 2;
  const midSz = (sL.z + sR.z) / 2;
  // mid-hip is already at origin after centering
  return Math.sqrt(midSx ** 2 + midSy ** 2 + midSz ** 2) || 1.0;
}

/**
 * Compute the angle (in radians) at joint B in the triplet A–B–C.
 * Returns NaN if any landmark is invisible.
 */
function angleBetween(
  a: Landmark3D,
  b: Landmark3D,
  c: Landmark3D,
): number {
  const vis = (lm: Landmark3D) => (lm.visibility ?? 1) >= VISIBILITY_THRESHOLD;
  if (!vis(a) || !vis(b) || !vis(c)) return NaN;

  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBa = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBc = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (magBa === 0 || magBc === 0) return NaN;
  return Math.acos(Math.max(-1, Math.min(1, dot / (magBa * magBc))));
}

/**
 * Build a joint-angle feature matrix for one frame.
 *
 * For each joint j we compute the angles formed with every pair of its
 * neighbours in the bone graph. We then average these angles per axis
 * direction (x-projected, y-projected, z-projected).
 *
 * Returns Float32Array of shape [NUM_JOINTS * 3]: [jx, jy, jz, ...]
 */
export function normalisePose(rawLandmarks: Landmark3D[]): Float32Array {
  if (rawLandmarks.length !== NUM_JOINTS) {
    throw new Error(`Expected ${NUM_JOINTS} landmarks, got ${rawLandmarks.length}`);
  }

  // Step 1 – centre + scale
  const centered = centerOnMidHip(rawLandmarks);
  const scale = torsoHeight(centered);
  const scaled = centered.map(lm => ({
    ...lm,
    x: lm.x / scale,
    y: lm.y / scale,
    z: lm.z / scale,
  }));

  // Build neighbour list from bone edges
  const neighbours: number[][] = Array.from({ length: NUM_JOINTS }, () => []);
  for (const [a, b] of BONE_EDGES) {
    neighbours[a].push(b);
    neighbours[b].push(a);
  }

  const features = new Float32Array(NUM_JOINTS * 3);

  for (let j = 0; j < NUM_JOINTS; j++) {
    const neigh = neighbours[j];
    if (neigh.length < 2) {
      // Leaf joint — use normalised position directly
      const lm = scaled[j];
      const v = (lm.visibility ?? 1) >= VISIBILITY_THRESHOLD;
      features[j * 3 + 0] = v ? lm.x : NaN;
      features[j * 3 + 1] = v ? lm.y : NaN;
      features[j * 3 + 2] = v ? lm.z : NaN;
      continue;
    }

    // Compute all pairwise angles at joint j
    let sumX = 0, sumY = 0, sumZ = 0, count = 0;
    for (let i = 0; i < neigh.length; i++) {
      for (let k = i + 1; k < neigh.length; k++) {
        const ang = angleBetween(scaled[neigh[i]], scaled[j], scaled[neigh[k]]);
        if (!isNaN(ang)) {
          // Project angle onto axes using the bone direction vectors
          const ba = scaled[neigh[i]];
          sumX += ang * Math.abs(ba.x);
          sumY += ang * Math.abs(ba.y);
          sumZ += ang * Math.abs(ba.z);
          count++;
        }
      }
    }

    if (count > 0) {
      features[j * 3 + 0] = sumX / count;
      features[j * 3 + 1] = sumY / count;
      features[j * 3 + 2] = sumZ / count;
    } else {
      features[j * 3 + 0] = NaN;
      features[j * 3 + 1] = NaN;
      features[j * 3 + 2] = NaN;
    }
  }

  return features;
}