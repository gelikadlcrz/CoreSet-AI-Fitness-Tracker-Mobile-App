/**
 * RepCounter
 *
 * Converts ST-GCN density maps into stable user-facing repetition counts.
 *
 * This version:
 * - prevents threshold from exceeding the strongest density peak
 * - uses local prominence to ignore weak/noisy bumps
 * - applies non-maximum suppression inside each window
 * - uses global cooldown to avoid duplicate counts from overlapping windows
 */

import { WINDOW_SIZE } from '../utils/temporalBuffer';

export interface RepEvent {
  repNumber: number;
  frameIndex: number;
  timestamp: number;
}

export type RepEventCallback = (event: RepEvent) => void;

export interface DensityDecodeResult {
  peakFrames: number[];
  totalCountEstimate: number;
  maxDensity: number;
  threshold: number;
}

const MIN_PEAK_DISTANCE_FRAMES = 32;
const ABSOLUTE_MIN_PEAK = 0.35;
const RELATIVE_PEAK_RATIO = 0.58;
const MIN_PROMINENCE = 0.08;

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function std(values: number[], average: number): number {
  if (values.length === 0) {
    return 0;
  }

  const variance =
    values.reduce((total, value) => total + (value - average) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

function sanitizeDensity(rawDensityMap: number[]): number[] {
  return rawDensityMap.map((value) => {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, value);
  });
}

function getLocalBaseline(
  density: number[],
  index: number,
  radius: number = 5
): number {
  const start = Math.max(0, index - radius);
  const end = Math.min(density.length - 1, index + radius);

  const values: number[] = [];

  for (let i = start; i <= end; i++) {
    if (i !== index) {
      values.push(density[i]);
    }
  }

  return mean(values);
}

function decodeDensityMapStable(rawDensityMap: number[]): DensityDecodeResult {
  const density = sanitizeDensity(rawDensityMap);

  if (density.length === 0) {
    return {
      peakFrames: [],
      totalCountEstimate: 0,
      maxDensity: 0,
      threshold: ABSOLUTE_MIN_PEAK,
    };
  }

  const maxDensity = Math.max(...density);
  const average = mean(density);
  const deviation = std(density, average);

  if (maxDensity < ABSOLUTE_MIN_PEAK) {
    return {
      peakFrames: [],
      totalCountEstimate: 0,
      maxDensity,
      threshold: ABSOLUTE_MIN_PEAK,
    };
  }

  const adaptiveThreshold = Math.max(
    ABSOLUTE_MIN_PEAK,
    maxDensity * RELATIVE_PEAK_RATIO,
    average + deviation * 0.75
  );

  // Prevent cases like threshold > maxDensity.
  const threshold = Math.min(adaptiveThreshold, maxDensity * 0.9);

  const rawPeaks: Array<{ index: number; value: number }> = [];

  for (let index = 1; index < density.length - 1; index++) {
    const previous = density[index - 1];
    const current = density[index];
    const next = density[index + 1];

    const isLocalPeak = current >= previous && current > next;

    const localBaseline = getLocalBaseline(density, index);
    const prominence = current - localBaseline;

    const isStrongEnough = current >= threshold;
    const isProminentEnough = prominence >= MIN_PROMINENCE;

    if (isLocalPeak && isStrongEnough && isProminentEnough) {
      rawPeaks.push({
        index,
        value: current,
      });
    }
  }

  // Non-maximum suppression: strongest peaks win.
  rawPeaks.sort((a, b) => b.value - a.value);

  const selected: Array<{ index: number; value: number }> = [];

  for (const candidate of rawPeaks) {
    const tooClose = selected.some(
      (peak) =>
        Math.abs(peak.index - candidate.index) < MIN_PEAK_DISTANCE_FRAMES
    );

    if (!tooClose) {
      selected.push(candidate);
    }
  }

  selected.sort((a, b) => a.index - b.index);

  return {
    peakFrames: selected.map((peak) => peak.index),
    totalCountEstimate: selected.length,
    maxDensity,
    threshold,
  };
}

export class RepCounter {
  private totalReps = 0;
  private globalFrame = 0;
  private lastPeakGlobalFrame = -1;
  private callbacks: RepEventCallback[] = [];

  onRep(callback: RepEventCallback): () => void {
    this.callbacks.push(callback);

    return () => {
      this.callbacks = this.callbacks.filter((item) => item !== callback);
    };
  }

  processWindow(
    rawDensityMap: number[],
    windowStartGlobalFrame: number
  ): DensityDecodeResult {
    const result = decodeDensityMapStable(rawDensityMap);

    console.log(
      `RepCounter: peaks=${result.peakFrames.join(',') || 'none'}, max=${result.maxDensity.toFixed(
        3
      )}, threshold=${result.threshold.toFixed(3)}`
    );

    for (const localPeakFrame of result.peakFrames) {
      const globalPeakFrame = windowStartGlobalFrame + localPeakFrame;

      if (
        globalPeakFrame >
        this.lastPeakGlobalFrame + MIN_PEAK_DISTANCE_FRAMES
      ) {
        this.totalReps++;
        this.lastPeakGlobalFrame = globalPeakFrame;

        const event: RepEvent = {
          repNumber: this.totalReps,
          frameIndex: globalPeakFrame,
          timestamp: Date.now(),
        };

        for (const callback of this.callbacks) {
          callback(event);
        }
      }
    }

    this.globalFrame = windowStartGlobalFrame + WINDOW_SIZE;

    return result;
  }

  incrementGlobalFrame(): void {
    this.globalFrame++;
  }

  get currentGlobalFrame(): number {
    return this.globalFrame;
  }

  get repCount(): number {
    return this.totalReps;
  }

  reset(): void {
    this.totalReps = 0;
    this.globalFrame = 0;
    this.lastPeakGlobalFrame = -1;
  }
}