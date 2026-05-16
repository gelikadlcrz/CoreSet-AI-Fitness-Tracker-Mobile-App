/**
 * RepCounter
 *
 * Conservative repetition counter for ST-GCN density output.
 *
 * This version avoids counting every small movement/noisy density bump.
 * A rep is counted only when:
 *  - the density map has a strong enough peak,
 *  - the peak is locally dominant,
 *  - it is far enough from the last counted peak,
 *  - the caller has already confirmed stable class + real motion.
 */

import { WINDOW_SIZE } from '../../capture/utils/temporalBuffer';

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

const MIN_PEAK_DISTANCE_FRAMES = 22;
const ABSOLUTE_MIN_PEAK = 0.25;
const RELATIVE_PEAK_RATIO = 0.65;

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

function decodeDensityMapStrict(rawDensityMap: number[]): DensityDecodeResult {
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

  const threshold = Math.max(
    ABSOLUTE_MIN_PEAK,
    maxDensity * RELATIVE_PEAK_RATIO,
    average + deviation * 1.5
  );

  if (maxDensity < ABSOLUTE_MIN_PEAK) {
    return {
      peakFrames: [],
      totalCountEstimate: 0,
      maxDensity,
      threshold,
    };
  }

  const rawPeaks: Array<{ index: number; value: number }> = [];

  for (let index = 1; index < density.length - 1; index++) {
    const previous = density[index - 1];
    const current = density[index];
    const next = density[index + 1];

    const isLocalPeak = current >= previous && current > next;
    const isStrongEnough = current >= threshold;

    if (isLocalPeak && isStrongEnough) {
      rawPeaks.push({
        index,
        value: current,
      });
    }
  }

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
    const result = decodeDensityMapStrict(rawDensityMap);

    console.log(
      `RepCounter: peaks=${result.peakFrames.join(',') || 'none'}, max=${
        result.maxDensity
      .toFixed(3)}, threshold=${result.threshold.toFixed(3)}`
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