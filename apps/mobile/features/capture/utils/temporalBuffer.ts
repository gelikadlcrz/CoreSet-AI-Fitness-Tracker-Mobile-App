import { NUM_JOINTS } from '../../../ml/graph/adjacencyMatrix';

export const WINDOW_SIZE = 64;   // DEPLOY_MAX_FRAMES
export const FEATURE_DIM = 14;   // DEPLOY_IN_CHANNELS — angle features

function cubicSplineInterpolate(values: (number | null)[]): number[] {
  const n = values.length;
  const out = [...values] as number[];
  const known: number[] = [];
  for (let i = 0; i < n; i++) {
    if (values[i] !== null && !isNaN(values[i] as number)) known.push(i);
  }
  if (known.length === 0) return out.map(() => 0);
  if (known.length === 1) return out.map(() => values[known[0]] as number);
  for (let i = 0; i < n; i++) {
    if (values[i] !== null && !isNaN(values[i] as number)) continue;
    let lo = -1, hi = -1;
    for (const k of known) { if (k < i) lo = k; }
    for (const k of known) { if (k > i) { hi = k; break; } }
    if (lo === -1) out[i] = values[hi] as number;
    else if (hi === -1) out[i] = values[lo] as number;
    else {
      const t = (i - lo) / (hi - lo);
      out[i] = (values[lo] as number) * (1 - t) + (values[hi] as number) * t;
    }
  }
  return out;
}

export class TemporalBuffer {
  private frames: (Float32Array | null)[] = [];

  constructor(private windowSize: number = WINDOW_SIZE) {}

  push(frame: Float32Array): void {
    if (frame.length !== FEATURE_DIM) {
      throw new Error(`Frame must have ${FEATURE_DIM} features, got ${frame.length}`);
    }
    this.frames.push(frame);
    if (this.frames.length > this.windowSize) this.frames.shift();
  }

  get size(): number { return this.frames.length; }

  /**
   * Returns Float32Array shaped [C, T, V, 1] = [14, 64, 33, 1]
   * flattened in C-major order to match the TFLite input contract.
   *
   * Wait — the export script uses shape [1, C, T, V, 1] but TFLite
   * strips the batch dim, so the input is [C, T, V, 1] = [14, 64, 33, 1].
   *
   * BUT normalisePose outputs [FEATURE_DIM=14] per frame, not per joint.
   * So layout is: for each channel c, for each time t, value = features[c]
   * with V=33 implied by the graph convolution inside the model.
   *
   * Correct flat layout: [C=14][T=64][V=33][M=1]
   * index = c*(T*V*M) + t*(V*M) + v*M + 0
   */
  getWindow(): Float32Array {
    const padded: (Float32Array | null)[] = [];
    const firstFrame = this.frames.find(f => f !== null) ?? null;
    const needed = this.windowSize - this.frames.length;
    for (let i = 0; i < needed; i++) padded.push(firstFrame);
    for (const f of this.frames) padded.push(f);

    const T = this.windowSize;
    const V = NUM_JOINTS;  // 33
    const C = FEATURE_DIM; // 14
    const M = 1;

    const out = new Float32Array(C * T * V * M);

    // Interpolate per channel c across time t
    for (let c = 0; c < C; c++) {
      const signal: (number | null)[] = padded.map(f =>
        f === null ? null : (isNaN(f[c]) ? null : f[c])
      );
      const interp = cubicSplineInterpolate(signal);
      for (let t = 0; t < T; t++) {
        // Broadcast the single feature value across all V joints
        for (let v = 0; v < V; v++) {
          out[c * (T * V * M) + t * (V * M) + v * M] = interp[t];
        }
      }
    }

    return out;
  }

  reset(): void { this.frames = []; }
}