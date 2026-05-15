import { ANGLE_FEATURE_DIM, FRAME_FEATURES } from '../../../../ml/preprocessing/normalizePose';
import { NUM_JOINTS } from '../../../../ml/graph/adjacencyMatrix';

export const WINDOW_SIZE = 64;
export const FEATURE_DIM = ANGLE_FEATURE_DIM;

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

    let lo = -1;
    let hi = -1;
    for (const k of known) if (k < i) lo = k;
    for (const k of known) {
      if (k > i) {
        hi = k;
        break;
      }
    }

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
    if (frame.length !== FRAME_FEATURES) {
      throw new Error(`Frame must have ${FRAME_FEATURES} features, got ${frame.length}`);
    }
    this.frames.push(frame);
    if (this.frames.length > this.windowSize) this.frames.shift();
  }

  get size(): number {
    return this.frames.length;
  }

  /**
   * Returns Float32Array shaped [C, T, V, 1] flattened in channel-major order.
   */
  getWindow(): Float32Array {
    const padded: (Float32Array | null)[] = [];
    const firstFrame = this.frames.find(f => f !== null) ?? null;
    const needed = this.windowSize - this.frames.length;

    for (let i = 0; i < needed; i++) padded.push(firstFrame);
    for (const f of this.frames) padded.push(f);

    const T = this.windowSize;
    const V = NUM_JOINTS;
    const C = FEATURE_DIM;
    const M = 1;

    const out = new Float32Array(C * T * V * M);

    for (let c = 0; c < C; c++) {
      for (let v = 0; v < V; v++) {
        const signal: (number | null)[] = padded.map(f => {
          if (f === null) return null;
          const value = f[c * V + v];
          return isNaN(value) ? null : value;
        });

        const interp = cubicSplineInterpolate(signal);
        for (let t = 0; t < T; t++) {
          out[c * (T * V * M) + t * (V * M) + v * M] = interp[t];
        }
      }
    }

    return out;
  }

  reset(): void {
    this.frames = [];
  }
}