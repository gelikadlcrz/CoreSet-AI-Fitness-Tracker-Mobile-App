/**
 * decodeDensityMap
 *
 * Post-processes the ST-GCN density-map head output into a stable,
 * human-readable repetition count.
 */

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
    }, 0),
  );
}

export interface DensityDecodeResult {
  confirmedReps: number;
  fractionalReps: number;
  smoothedMap: number[];
  peakFrames: number[];
}

const GAUSSIAN_SIGMA = 1.25;
const GAUSSIAN_SIZE = 7;
const PEAK_HEIGHT_THRESHOLD = 0.25;
const PEAK_MIN_DISTANCE = 8;

export function decodeDensityMap(rawDensityMap: number[]): DensityDecodeResult {
  if (rawDensityMap.length === 0) {
    return { confirmedReps: 0, fractionalReps: 0, smoothedMap: [], peakFrames: [] };
  }

  const density = rawDensityMap.map(v => {
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, v);
  });

  const kernel = gaussianKernel(GAUSSIAN_SIGMA, GAUSSIAN_SIZE);
  const smoothedMap = convolve1D(density, kernel);
  const fractionalReps = Math.max(0, smoothedMap.reduce((a, b) => a + b, 0));

  const maxVal = Math.max(...smoothedMap);
  if (maxVal <= 0) {
    return { confirmedReps: 0, fractionalReps, smoothedMap, peakFrames: [] };
  }

  const minPeakHeight = maxVal * PEAK_HEIGHT_THRESHOLD;
  const peakFrames: number[] = [];

  for (let i = 1; i < smoothedMap.length - 1; i++) {
    const isLocalMax = smoothedMap[i] > smoothedMap[i - 1] && smoothedMap[i] >= smoothedMap[i + 1];
    const aboveThreshold = smoothedMap[i] >= minPeakHeight;

    if (!isLocalMax || !aboveThreshold) continue;

    const lastPeak = peakFrames[peakFrames.length - 1] ?? -Infinity;
    if (i - lastPeak >= PEAK_MIN_DISTANCE) {
      peakFrames.push(i);
    }
  }

  return {
    confirmedReps: peakFrames.length,
    fractionalReps,
    smoothedMap,
    peakFrames,
  };
}
