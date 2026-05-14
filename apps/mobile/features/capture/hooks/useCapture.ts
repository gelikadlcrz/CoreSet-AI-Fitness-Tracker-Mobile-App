/**
 * useCapture
 *
 * Orchestrates the on-device capture pipeline.
 *
 * Counting now has two paths:
 *  1. ST-GCN density-map counting once a full 64-frame window is ready.
 *  2. A lightweight pose-motion counter that updates immediately from landmarks.
 *
 * The lightweight counter is not a replacement for the trained model. It keeps the
 * UI usable while the ST-GCN input/output contract is being verified.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  useFrameProcessor,
  type Frame,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { useSharedValue, Worklets } from 'react-native-worklets-core';

import {
  loadBlazePose,
  frameToLandmarkInputTensor,
  detectPose,
  isFrameUsable,
  type RawLandmarks,
} from '../pose/BlazePoseDetector';
import { normalisePose } from '../../../ml/preprocessing/normalizePose';
import { TemporalBuffer, WINDOW_SIZE } from '../utils/temporalBuffer';
import { STGCNRunner, type ExerciseClass } from '../inference/STGCNRunner';
import { RepCounter, type RepEvent } from '../postprocessing/RepCounter';

const STRIDE = Math.floor(WINDOW_SIZE / 2);
const CAMERA_PROCESS_FPS = 15;

type MotionPhase = 'unknown' | 'bottom' | 'top';

type MotionTrackerState = {
  repCount: number;
  phase: MotionPhase;
  minY: number;
  maxY: number;
  smoothY: number | null;
  lastCountTime: number;
  samples: number;
  lastDebugSample: number;
};

function createMotionTracker(): MotionTrackerState {
  return {
    repCount: 0,
    phase: 'unknown',
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    smoothY: null,
    lastCountTime: 0,
    samples: 0,
    lastDebugSample: 0,
  };
}

function finiteAverage(landmarks: RawLandmarks, indices: number[]): number | null {
  const vals = indices
    .map(i => landmarks[i]?.y)
    .filter((v): v is number => Number.isFinite(v));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function estimateBodyScale(landmarks: RawLandmarks): number {
  const shoulderY = finiteAverage(landmarks, [11, 12]);
  const hipY = finiteAverage(landmarks, [23, 24]);
  if (shoulderY !== null && hipY !== null) {
    return Math.max(1, Math.abs(hipY - shoulderY));
  }
  return 80;
}

/**
 * Pull-up motion counter.
 *
 * In BlazePose image coordinates, y becomes smaller when the body moves upward.
 * A rep is counted when the tracked torso/shoulder signal goes from the lower
 * zone to the upper zone, then it waits for the user to return to the lower zone.
 */
function updatePullupMotionCounter(
  tracker: MotionTrackerState,
  landmarks: RawLandmarks,
): number {
  const shoulderY = finiteAverage(landmarks, [11, 12]);
  const noseY = finiteAverage(landmarks, [0]);
  const hipY = finiteAverage(landmarks, [23, 24]);

  if (shoulderY === null) return tracker.repCount;

  // Shoulders are the most stable for pull-ups. Mix in nose/hips when available
  // so the signal still moves even if one shoulder is slightly noisy.
  const values = [shoulderY, shoulderY];
  if (noseY !== null) values.push(noseY);
  if (hipY !== null) values.push(hipY);
  const rawY = values.reduce((a, b) => a + b, 0) / values.length;

  tracker.samples += 1;
  tracker.smoothY = tracker.smoothY === null
    ? rawY
    : tracker.smoothY * 0.65 + rawY * 0.35;

  const y = tracker.smoothY;
  tracker.minY = Math.min(tracker.minY, y);
  tracker.maxY = Math.max(tracker.maxY, y);

  const range = tracker.maxY - tracker.minY;
  const bodyScale = estimateBodyScale(landmarks);

  // The previous 18px threshold was too strict. Your logs show only around
  // 8-12px vertical movement at the top of a pull-up, so use a body-relative
  // threshold with a small absolute floor.
  const minRequiredRange = Math.max(4, bodyScale * 0.045);
  if (tracker.samples < 6 || range < minRequiredRange) {
    if (tracker.samples - tracker.lastDebugSample >= 15) {
      tracker.lastDebugSample = tracker.samples;
      console.log(
        `Motion waiting: y=${y.toFixed(1)}, range=${range.toFixed(1)}, need=${minRequiredRange.toFixed(1)}`,
      );
    }
    return tracker.repCount;
  }

  const topThreshold = tracker.minY + range * 0.42;
  const bottomThreshold = tracker.minY + range * 0.68;
  const now = Date.now();
  const cooldownMs = 550;

  if (tracker.phase === 'unknown') {
    tracker.phase = y >= bottomThreshold ? 'bottom' : 'top';
    console.log(
      `Motion ready: phase=${tracker.phase}, y=${y.toFixed(1)}, top<=${topThreshold.toFixed(1)}, bottom>=${bottomThreshold.toFixed(1)}`,
    );
    return tracker.repCount;
  }

  if (tracker.phase === 'bottom' && y <= topThreshold) {
    if (now - tracker.lastCountTime > cooldownMs) {
      tracker.repCount += 1;
      tracker.lastCountTime = now;
      console.log(`Pull-up motion rep counted: ${tracker.repCount}`);
    }
    tracker.phase = 'top';
  } else if (tracker.phase === 'top' && y >= bottomThreshold) {
    tracker.phase = 'bottom';
  }

  return tracker.repCount;
}

export interface CaptureState {
  isReady: boolean;
  isRunning: boolean;
  repCount: number;
  exerciseClass: ExerciseClass | null;
  classConfidence: number;
  fps: number;
  error: string | null;
}

const initialState: CaptureState = {
  isReady: false,
  isRunning: false,
  repCount: 0,
  exerciseClass: null,
  classConfidence: 0,
  fps: 0,
  error: null,
};

export function useCapture() {
  const [state, setState] = useState<CaptureState>(initialState);

  const bufferRef = useRef(new TemporalBuffer(WINDOW_SIZE));
  const repCounterRef = useRef(new RepCounter());
  const stgcnRunnerRef = useRef(STGCNRunner.getInstance());
  const frameIndexRef = useRef(0);
  const windowStartRef = useRef(0);
  const fpsTimestampsRef = useRef<number[]>([]);
  const inferenceInFlightRef = useRef(false);
  const motionTrackerRef = useRef<MotionTrackerState>(createMotionTracker());

  const poseInFlight = useSharedValue(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadBlazePose(),
      stgcnRunnerRef.current.load(),
    ])
      .then(() => {
        if (!cancelled) setState(s => ({ ...s, isReady: true }));
      })
      .catch(err => {
        if (!cancelled) {
          setState(s => ({ ...s, error: `Model load failed: ${err?.message ?? err}` }));
        }
      });

    const unsubRep = repCounterRef.current.onRep((event: RepEvent) => {
      setState(s => ({
        ...s,
        repCount: Math.max(s.repCount, event.repNumber),
      }));
    });

    return () => {
      cancelled = true;
      unsubRep();
    };
  }, []);

  const updateClassification = useCallback(
    (exerciseClass: ExerciseClass, confidence: number) => {
      setState(s => ({ ...s, exerciseClass, classConfidence: confidence }));
    },
    [],
  );

  const updateFps = useCallback((fps: number) => {
    setState(s => ({ ...s, fps }));
  }, []);

  const reportError = useCallback((msg: string) => {
    setState(s => ({ ...s, error: msg }));
  }, []);

  const runStgcn = useCallback(
    async (windowTensor: Float32Array, windowStart: number) => {
      try {
        const result = await stgcnRunnerRef.current.run(windowTensor);
        const confidence = Math.max(...result.classProbs);
        updateClassification(result.exerciseClass, confidence);

        const decoded = repCounterRef.current.processWindow(result.densityMap, windowStart);
        console.log(
          `STGCN: class=${result.exerciseClass}, conf=${confidence.toFixed(2)}, densityLen=${result.densityMap.length}, peaks=${decoded.peakFrames.length}, frac=${decoded.fractionalReps.toFixed(2)}`,
        );
      } catch (e: any) {
        reportError(e?.message ?? 'ST-GCN inference error');
      } finally {
        inferenceInFlightRef.current = false;
      }
    },
    [updateClassification, reportError],
  );

  const onLandmarksReady = useCallback(
    (landmarks: RawLandmarks) => {
      poseInFlight.value = false;

      const validCount = landmarks.filter(lm => Number.isFinite(lm.x)).length;
      console.log(`Landmarks: ${validCount}/33 valid`);
      if (validCount > 0) {
        console.log('Sample landmark 0:', JSON.stringify(landmarks[0]));
        console.log('Sample landmark 23:', JSON.stringify(landmarks[23]));
      }

      if (!isFrameUsable(landmarks)) return;

      const motionCount = updatePullupMotionCounter(motionTrackerRef.current, landmarks);
      if (motionCount > 0) {
        setState(s => motionCount > s.repCount
          ? {
              ...s,
              repCount: motionCount,
              exerciseClass: s.exerciseClass ?? 'pullup',
              classConfidence: Math.max(s.classConfidence, 0.75),
            }
          : s,
        );
      }

      const featureVec = normalisePose(landmarks);
      bufferRef.current.push(featureVec);

      const frameIdx = ++frameIndexRef.current;

      const now = Date.now();
      fpsTimestampsRef.current.push(now);
      fpsTimestampsRef.current = fpsTimestampsRef.current.filter(t => now - t < 1000);
      if (frameIdx % CAMERA_PROCESS_FPS === 0) {
        updateFps(fpsTimestampsRef.current.length);
      }

      if (
        frameIdx % STRIDE === 0 &&
        bufferRef.current.size >= WINDOW_SIZE &&
        !inferenceInFlightRef.current
      ) {
        inferenceInFlightRef.current = true;
        const windowTensor = bufferRef.current.getWindow();
        const windowStart = windowStartRef.current;
        windowStartRef.current = frameIdx;
        runStgcn(windowTensor, windowStart);
      }
    },
    [runStgcn, updateFps],
  );

  const runBlazePoseAsync = useCallback(
    async (inputTensorData: number[]) => {
      try {
        const inputTensor = new Float32Array(inputTensorData);
        const landmarks = await detectPose(inputTensor);
        onLandmarksReady(landmarks);
      } catch (e: any) {
        poseInFlight.value = false;
        reportError(e?.message ?? 'BlazePose inference error');
      }
    },
    [onLandmarksReady, reportError],
  );

  const runBlazePoseAsyncOnJS = Worklets.createRunOnJS(runBlazePoseAsync);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';

      if (!state.isRunning) return;

      runAtTargetFps(CAMERA_PROCESS_FPS, () => {
        'worklet';

        if (poseInFlight.value) return;

        poseInFlight.value = true;
        const inputTensor = frameToLandmarkInputTensor(frame);
        runBlazePoseAsyncOnJS(Array.from(inputTensor));
      });
    },
    [state.isRunning, runBlazePoseAsyncOnJS],
  );

  const startCapture = useCallback(() => {
    bufferRef.current.reset();
    repCounterRef.current.reset();
    motionTrackerRef.current = createMotionTracker();
    frameIndexRef.current = 0;
    windowStartRef.current = 0;
    fpsTimestampsRef.current = [];
    inferenceInFlightRef.current = false;
    poseInFlight.value = false;
    setState(s => ({ ...s, isRunning: true, repCount: 0, error: null }));
  }, []);

  const stopCapture = useCallback(() => {
    setState(s => ({ ...s, isRunning: false }));
  }, []);

  const resetReps = useCallback(() => {
    bufferRef.current.reset();
    repCounterRef.current.reset();
    motionTrackerRef.current = createMotionTracker();
    frameIndexRef.current = 0;
    windowStartRef.current = 0;
    inferenceInFlightRef.current = false;
    setState(s => ({ ...s, repCount: 0 }));
  }, []);

  return {
    state,
    frameProcessor,
    startCapture,
    stopCapture,
    resetReps,
  };
}
