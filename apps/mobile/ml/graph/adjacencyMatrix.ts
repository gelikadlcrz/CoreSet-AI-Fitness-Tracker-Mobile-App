/**
 * BlazePose 33-landmark adjacency matrix for ST-GCN graph formulation.
 * Edges represent anatomical bone connections.
 *
 * Landmark indices follow MediaPipe BlazePose convention:
 * https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */

export const NUM_JOINTS = 33;

/** [from, to] pairs — undirected; we store both directions in the matrix */
export const BONE_EDGES: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Upper body
  [11, 12],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Lower body
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

/**
 * Build a sparse adjacency list (faster than dense matrix for 33 nodes).
 * Self-loops are included for identity connections (standard in GCN).
 */
export function buildAdjacencyList(): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (let i = 0; i < NUM_JOINTS; i++) adj.set(i, [i]); // self-loops

  for (const [a, b] of BONE_EDGES) {
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  return adj;
}

/**
 * Returns a flat Float32Array normalised adjacency matrix [NUM_JOINTS × NUM_JOINTS].
 * Used if the TFLite model expects a pre-computed adjacency input.
 */
export function buildNormalisedAdjacency(): Float32Array {
  const A = new Float32Array(NUM_JOINTS * NUM_JOINTS);

  // Set self-loops
  for (let i = 0; i < NUM_JOINTS; i++) A[i * NUM_JOINTS + i] = 1;

  // Set bone edges (undirected)
  for (const [a, b] of BONE_EDGES) {
    A[a * NUM_JOINTS + b] = 1;
    A[b * NUM_JOINTS + a] = 1;
  }

  // Row-normalise (D^{-1} A)
  for (let i = 0; i < NUM_JOINTS; i++) {
    let rowSum = 0;
    for (let j = 0; j < NUM_JOINTS; j++) rowSum += A[i * NUM_JOINTS + j];
    if (rowSum > 0) {
      for (let j = 0; j < NUM_JOINTS; j++) A[i * NUM_JOINTS + j] /= rowSum;
    }
  }

  return A;
}

/**
 * Exercise-specific "tracking joints" used for displacement estimation (VLwD).
 * These are the primary anatomical nodes monitored per exercise class.
 */
export const EXERCISE_TRACKING_JOINTS: Record<string, number[]> = {
  squat:      [23, 24, 25, 26], // hips + knees
  pushup:     [11, 12, 13, 14], // shoulders + elbows
  benchpress: [11, 12, 15, 16], // shoulders + wrists
  pullup:     [11, 12, 15, 16], // shoulders + wrists
};