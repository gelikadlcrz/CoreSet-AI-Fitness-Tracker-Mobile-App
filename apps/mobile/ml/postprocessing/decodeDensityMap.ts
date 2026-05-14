/**
 * decodeDensityMap
 *
 * Converts an ST-GCN density-map head into discrete rep peaks.
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

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function normaliseSignal(raw: number[]): number[] {
  const finite = raw.map(v => (Number.isFinite(v) ? v : 0));
  if (finite.length === 0) return finite;

  const min = Math.min(...finite);
  const max = Math.max(...finite);

  // If already a non-negative density/probability map, keep it.
  if (min >= 0 && max <= 1.5) return finite;

  // If the model exported logits, turn them into probability-like values.
  if (min < 0 && max > 0) return finite.map(sigmoid);

  // Otherwise min-max normalize for peak detection.
  const range = max - min;
  if (range < 1e-9) return finite.map(() => 0);
  return finite.map(v => (v - min) / range);
}

export interface DensityDecodeResult {
  confirmedReps: number;
  fractionalReps: number;
  smoothedMap: number[];
  peakFrames: number[];
}

const GAUSSIAN_SIGMA = 1.25;
const GAUSSIAN_SIZE = 5;
const PEAK_HEIGHT_THRESHOLD = 0.25;
const PEAK_MIN_DISTANCE = 6;

export function decodeDensityMap(rawDensityMap: number[]): DensityDecodeResult {
  if (rawDensityMap.length === 0) {
    return { confirmedReps: 0, fractionalReps: 0, smoothedMap: [], peakFrames: [] };
  }

  const normalized = normaliseSignal(rawDensityMap);
  const kernel = gaussianKernel(GAUSSIAN_SIGMA, GAUSSIAN_SIZE);
  const smoothedMap = convolve1D(normalized, kernel);

  const fractionalReps = Math.max(0, smoothedMap.reduce((a, b) => a + Math.max(0, b), 0));
  const maxVal = Math.max(...smoothedMap);
  const minPeakHeight = Math.max(0.03, maxVal * PEAK_HEIGHT_THRESHOLD);

  const peakFrames: number[] = [];
  for (let i = 1; i < smoothedMap.length - 1; i++) {
    const isLocalMax = smoothedMap[i] >= smoothedMap[i - 1] && smoothedMap[i] > smoothedMap[i + 1];
    const aboveThreshold = smoothedMap[i] >= minPeakHeight;

    if (isLocalMax && aboveThreshold) {
      const lastPeak = peakFrames[peakFrames.length - 1] ?? -Infinity;
      if (i - lastPeak >= PEAK_MIN_DISTANCE) {
        peakFrames.push(i);
      } else if (smoothedMap[i] > smoothedMap[lastPeak]) {
        peakFrames[peakFrames.length - 1] = i;
      }
    }
  }

  console.log(
    `Density decoded: len=${rawDensityMap.length}, max=${maxVal.toFixed(3)}, peaks=${peakFrames.join(',') || 'none'}`,
  );

  return {
    confirmedReps: peakFrames.length,
    fractionalReps,
    smoothedMap,
    peakFrames,
  };
}