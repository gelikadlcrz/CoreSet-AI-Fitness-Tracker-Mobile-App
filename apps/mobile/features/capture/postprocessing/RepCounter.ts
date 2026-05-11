/**
 * RepCounter
 *
 * Maintains stable, user-facing rep count across sliding inference windows.
 *
 * The ST-GCN model runs on a 30-frame sliding window with 15-frame stride
 * (50% overlap). Each run produces a new density map. We must merge overlapping
 * windows without double-counting.
 *
 * Algorithm:
 *  - Track the highest confirmed rep count seen so far (monotonic).
 *  - Use peak timestamps from the density map to de-duplicate reps that fall
 *    inside the previous window's range.
 *  - Emit a rep event only when a new peak appears beyond the last counted frame.
 */

import { decodeDensityMap, DensityDecodeResult } from '../../../ml/postprocessing/decodeDensityMap';
import { WINDOW_SIZE } from '../../capture/utils/temporalBuffer';

export interface RepEvent {
  repNumber: number;
  frameIndex: number; // global frame index of the rep peak
  timestamp: number;  // ms since epoch
}

export type RepEventCallback = (event: RepEvent) => void;

const STRIDE = Math.floor(WINDOW_SIZE / 2); // 15 frames

export class RepCounter {
  private totalReps = 0;
  private globalFrame = 0;
  private lastPeakGlobalFrame = -1;
  private callbacks: RepEventCallback[] = [];

  onRep(cb: RepEventCallback): () => void {
    this.callbacks.push(cb);
    return () => { this.callbacks = this.callbacks.filter(c => c !== cb); };
  }

  /**
   * Call this every STRIDE frames with the latest density map output.
   * windowStartGlobalFrame: the global frame index where this window begins.
   */
  processWindow(
    rawDensityMap: number[],
    windowStartGlobalFrame: number,
  ): DensityDecodeResult {
    const result = decodeDensityMap(rawDensityMap);

    for (const localPeakFrame of result.peakFrames) {
      const globalPeakFrame = windowStartGlobalFrame + localPeakFrame;

      // Only count a peak if it's beyond the last counted one + guard zone
      const guard = Math.floor(STRIDE * 0.5);
      if (globalPeakFrame > this.lastPeakGlobalFrame + guard) {
        this.totalReps++;
        this.lastPeakGlobalFrame = globalPeakFrame;
        const event: RepEvent = {
          repNumber: this.totalReps,
          frameIndex: globalPeakFrame,
          timestamp: Date.now(),
        };
        for (const cb of this.callbacks) cb(event);
      }
    }

    this.globalFrame = windowStartGlobalFrame + WINDOW_SIZE;
    return result;
  }

  incrementGlobalFrame(): void { this.globalFrame++; }

  get currentGlobalFrame(): number { return this.globalFrame; }
  get repCount(): number { return this.totalReps; }

  reset(): void {
    this.totalReps = 0;
    this.globalFrame = 0;
    this.lastPeakGlobalFrame = -1;
  }
}