/**
 * decodeDensityMap
 *
 * Post-processes the ST-GCN density-map head output into a stable,
 * human-readable repetition count.
 *
 * The density map D[t] (length T) represents the continuous probability
 * distribution of rep peaks over time. The integral ∑D[t] equals the
 * fractional rep count.
 *
 * Strategy:
 *  1. Convolve the map with a Gaussian kernel to suppress noise.
 *  2. Detect local maxima (rep peaks).
 *  3. Apply a minimum peak-height threshold to ignore phantom peaks.
 *  4. Return the discrete peak count (confirmed reps) and the fractional
 *     count (for VLwD analytics).
 */

/** Gaussian kernel for temporal smoothing */
function gaussianKernel(sigma: number, size: number): number[] {
  const kernel: number[] = [];
  const half = Math.floor(size / 2);
  let sum = 0;
  for (let i = -half; i <= half; i++) {
    const val = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(val);
    sum += val;
  }
  return kernel.map(v => v / sum);
}

function convolve1D(signal: number[], kernel: number[]): number[] {
  const half = Math.floor(kernel.length / 2);
  return signal.map((_, i) =>
    kernel.reduce((acc, k, ki) => {
      const si = i + ki - half;
      return acc + k * (signal[Math.max(0, Math.min(signal.length - 1, si))] ?? 0);
    }, 0)
  );
}

export interface DensityDecodeResult {
  /** Integer confirmed rep count (peak detection) */
  confirmedReps: number;
  /** Fractional rep count (integral of density map) */
  fractionalReps: number;
  /** Smoothed density map (for visualisation) */
  smoothedMap: number[];
  /** Indices of detected peak frames */
  peakFrames: number[];
}

const GAUSSIAN_SIGMA = 1.5;
const GAUSSIAN_SIZE = 7;
const PEAK_HEIGHT_THRESHOLD = 0.15; // minimum peak height (relative to max)
const PEAK_MIN_DISTANCE = 5;        // minimum frames between peaks (~167ms @ 30fps)

export function decodeDensityMap(rawDensityMap: number[]): DensityDecodeResult {
  if (rawDensityMap.length === 0) {
    return { confirmedReps: 0, fractionalReps: 0, smoothedMap: [], peakFrames: [] };
  }

  // Step 1 — smooth
  const kernel = gaussianKernel(GAUSSIAN_SIGMA, GAUSSIAN_SIZE);
  const smoothedMap = convolve1D(rawDensityMap, kernel);

  // Step 2 — fractional count
  const fractionalReps = Math.max(0, smoothedMap.reduce((a, b) => a + b, 0));

  // Step 3 — peak detection
  const maxVal = Math.max(...smoothedMap);
  const minPeakHeight = maxVal * PEAK_HEIGHT_THRESHOLD;

  const peakFrames: number[] = [];
  for (let i = 1; i < smoothedMap.length - 1; i++) {
    const isLocalMax =
      smoothedMap[i] > smoothedMap[i - 1] && smoothedMap[i] > smoothedMap[i + 1];
    const aboveThreshold = smoothedMap[i] >= minPeakHeight;

    if (isLocalMax && aboveThreshold) {
      // Enforce minimum distance
      const lastPeak = peakFrames[peakFrames.length - 1] ?? -Infinity;
      if (i - lastPeak >= PEAK_MIN_DISTANCE) {
        peakFrames.push(i);
      }
    }
  }

  return {
    confirmedReps: peakFrames.length,
    fractionalReps,
    smoothedMap,
    peakFrames,
  };
}