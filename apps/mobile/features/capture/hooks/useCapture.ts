/**
 * useCapture
 *
 * Orchestrates the full on-device capture pipeline:
 *
 *   Camera frame (30 fps)
 *     → frameToInputTensor()      [JS, frame-processor thread]
 *     → detectPose()              [fast-tflite / NNAPI — BlazePose]
 *     → parseLandmarkTensor()
 *     → normalisePose()
 *     → TemporalBuffer.push()
 *     → (every STRIDE frames) STGCNRunner.run()  [fast-tflite / NNAPI]
 *     → RepCounter.processWindow()
 *     → setState()                [UI thread via Worklets.createRunOnJS]
 *
 * Both TFLite models are loaded once on mount and reused for the session.
 * Raw frame pixels are never stored — only the 33-landmark float arrays.
 *
 * Threading model:
 *   frameToInputTensor runs synchronously inside the Vision Camera worklet.
 *   detectPose + STGCNRunner.run are async (fast-tflite dispatches to a
 *   native thread), so they are called via Worklets.createRunOnJS to avoid
 *   blocking the camera thread.
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
  frameToInputTensor,
  detectPose,
  isFrameUsable,
  type RawLandmarks,
} from '../pose/BlazePoseDetector';
import { normalisePose } from '../../../ml/preprocessing/normalizePose';
import { TemporalBuffer, WINDOW_SIZE } from '../utils/temporalBuffer';
import { STGCNRunner, type ExerciseClass } from '../inference/STGCNRunner';
import { RepCounter, type RepEvent } from '../postprocessing/RepCounter';

// ─── Constants ────────────────────────────────────────────────────────────────

const STRIDE = Math.floor(WINDOW_SIZE / 2);

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCapture() {
  const [state, setState] = useState<CaptureState>(initialState);

  const bufferRef            = useRef(new TemporalBuffer(WINDOW_SIZE));
  const repCounterRef        = useRef(new RepCounter());
  const stgcnRunnerRef       = useRef(STGCNRunner.getInstance());
  const frameIndexRef        = useRef(0);
  const windowStartRef       = useRef(0);
  const fpsTimestampsRef     = useRef<number[]>([]);
  const inferenceInFlightRef = useRef(false);

  // Shared value accessible from Vision Camera worklet thread
  const poseInFlight = useSharedValue(false);

  // ── Load both models on mount ──────────────────────────────────────────────
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
      setState(s => ({ ...s, repCount: event.repNumber }));
    });

    return () => {
      cancelled = true;
      unsubRep();
    };
  }, []);

  // ── UI-thread callbacks ────────────────────────────────────────────────────

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

  // ── Async inference pipeline ───────────────────────────────────────────────

  const onLandmarksReady = useCallback(
    (landmarks: RawLandmarks) => {
      poseInFlight.value = false;

      if (!isFrameUsable(landmarks)) return;

      const featureVec = normalisePose(landmarks);
      bufferRef.current.push(featureVec);

      const frameIdx = ++frameIndexRef.current;

      const now = Date.now();
      fpsTimestampsRef.current.push(now);
      fpsTimestampsRef.current = fpsTimestampsRef.current.filter(t => now - t < 1000);
      if (frameIdx % 30 === 0) {
        updateFps(fpsTimestampsRef.current.length);
      }

      if (
        frameIdx % STRIDE === 0 &&
        bufferRef.current.size >= WINDOW_SIZE &&
        !inferenceInFlightRef.current
      ) {
        inferenceInFlightRef.current = true;
        const windowTensor = bufferRef.current.getWindow();
        const windowStart  = windowStartRef.current;
        windowStartRef.current = frameIdx;
        runStgcn(windowTensor, windowStart);
      }
    },
    [updateFps],
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

  const runStgcn = useCallback(
    async (windowTensor: Float32Array, windowStart: number) => {
      try {
        const result = await stgcnRunnerRef.current.run(windowTensor);
        const confidence = Math.max(...result.classProbs);
        updateClassification(result.exerciseClass, confidence);
        repCounterRef.current.processWindow(result.densityMap, windowStart);
      } catch (e: any) {
        reportError(e?.message ?? 'ST-GCN inference error');
      } finally {
        inferenceInFlightRef.current = false;
      }
    },
    [updateClassification, reportError],
  );

  // ── Vision Camera worklet-safe JS callbacks ────────────────────────────────

  const runBlazePoseAsyncOnJS = Worklets.createRunOnJS(runBlazePoseAsync);
  const reportErrorOnJS       = Worklets.createRunOnJS(reportError);

  // ── Frame processor (camera worklet thread) ────────────────────────────────

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';

      if (!state.isRunning) return;

      runAtTargetFps(30, () => {
        'worklet';

        if (poseInFlight.value) return;

        try {
          const inputTensor = frameToInputTensor(frame);
          poseInFlight.value = true;
          runBlazePoseAsyncOnJS(Array.from(inputTensor));
        } catch (e: any) {
          reportErrorOnJS(e?.message ?? 'Frame conversion error');
        }
      });
    },
    [state.isRunning, runBlazePoseAsyncOnJS, reportErrorOnJS],
  );

  // ── Controls ───────────────────────────────────────────────────────────────

  const startCapture = useCallback(() => {
    bufferRef.current.reset();
    repCounterRef.current.reset();
    frameIndexRef.current        = 0;
    windowStartRef.current       = 0;
    fpsTimestampsRef.current     = [];
    inferenceInFlightRef.current = false;
    poseInFlight.value           = false;
    setState(s => ({ ...s, isRunning: true, repCount: 0, error: null }));
  }, []);

  const stopCapture = useCallback(() => {
    setState(s => ({ ...s, isRunning: false }));
  }, []);

  const resetReps = useCallback(() => {
    repCounterRef.current.reset();
    frameIndexRef.current  = 0;
    windowStartRef.current = 0;
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