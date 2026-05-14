import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrameProcessor, type Frame, runAtTargetFps } from 'react-native-vision-camera';
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

const STRIDE = Math.floor(WINDOW_SIZE / 2);
const LANDMARK_UI_UPDATE_MS = 80;
const LANDMARK_SMOOTHING_ALPHA = 0.35;

export interface CaptureState {
  isReady: boolean;
  isRunning: boolean;
  repCount: number;
  exerciseClass: ExerciseClass | null;
  classConfidence: number;
  fps: number;
  error: string | null;
  landmarks: RawLandmarks | null;
}

const initialState: CaptureState = {
  isReady: false,
  isRunning: false,
  repCount: 0,
  exerciseClass: null,
  classConfidence: 0,
  fps: 0,
  error: null,
  landmarks: null,
};

function smoothLandmarks(prev: RawLandmarks | null, current: RawLandmarks): RawLandmarks {
  if (!prev || prev.length !== current.length) return current;

  return current.map((lm, idx) => {
    const prevLm = prev[idx];
    if (!Number.isFinite(lm.x) || !Number.isFinite(lm.y) || !Number.isFinite(lm.z)) {
      return prevLm;
    }
    if (!Number.isFinite(prevLm.x) || !Number.isFinite(prevLm.y) || !Number.isFinite(prevLm.z)) {
      return lm;
    }

    return {
      x: prevLm.x + (lm.x - prevLm.x) * LANDMARK_SMOOTHING_ALPHA,
      y: prevLm.y + (lm.y - prevLm.y) * LANDMARK_SMOOTHING_ALPHA,
      z: prevLm.z + (lm.z - prevLm.z) * LANDMARK_SMOOTHING_ALPHA,
      visibility: ((prevLm.visibility ?? 0) * (1 - LANDMARK_SMOOTHING_ALPHA)) + ((lm.visibility ?? 0) * LANDMARK_SMOOTHING_ALPHA),
    };
  });
}

export function useCapture() {
  const [state, setState] = useState<CaptureState>(initialState);

  const bufferRef = useRef(new TemporalBuffer(WINDOW_SIZE));
  const repCounterRef = useRef(new RepCounter());
  const stgcnRunnerRef = useRef(STGCNRunner.getInstance());
  const frameIndexRef = useRef(0);
  const windowStartRef = useRef(0);
  const fpsTimestampsRef = useRef<number[]>([]);
  const inferenceInFlightRef = useRef(false);
  const smoothedLandmarksRef = useRef<RawLandmarks | null>(null);
  const lastLandmarkUiUpdateRef = useRef(0);
  const poseInFlight = useSharedValue(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadBlazePose(), stgcnRunnerRef.current.load()])
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

  const updateClassification = useCallback((exerciseClass: ExerciseClass, confidence: number) => {
    setState(s => ({ ...s, exerciseClass, classConfidence: confidence }));
  }, []);

  const updateFps = useCallback((fps: number) => {
    setState(s => ({ ...s, fps }));
  }, []);

  const reportError = useCallback((msg: string) => {
    setState(s => ({ ...s, error: msg }));
  }, []);

  const onLandmarksReady = useCallback(
    (landmarks: RawLandmarks) => {
      poseInFlight.value = false;

      if (!isFrameUsable(landmarks)) return;

      const smoothedLandmarks = smoothLandmarks(smoothedLandmarksRef.current, landmarks);
      smoothedLandmarksRef.current = smoothedLandmarks;

      const featureVec = normalisePose(smoothedLandmarks);
      bufferRef.current.push(featureVec);

      const frameIdx = ++frameIndexRef.current;
      const now = Date.now();

      if (now - lastLandmarkUiUpdateRef.current >= LANDMARK_UI_UPDATE_MS) {
        lastLandmarkUiUpdateRef.current = now;
        setState(s => ({ ...s, landmarks: smoothedLandmarks }));
      }

      fpsTimestampsRef.current.push(now);
      fpsTimestampsRef.current = fpsTimestampsRef.current.filter(t => now - t < 1000);
      if (frameIdx % 15 === 0) {
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
    [updateFps],
  );

  const runBlazePoseAsync = useCallback(
    async (frame: Frame) => {
      try {
        const inputTensor = await frameToInputTensor(frame);
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

  const runBlazePoseAsyncOnJS = Worklets.createRunOnJS(runBlazePoseAsync);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      if (!state.isRunning) return;

      runAtTargetFps(15, () => {
        'worklet';
        if (poseInFlight.value) return;
        poseInFlight.value = true;
        runBlazePoseAsyncOnJS(frame);
      });
    },
    [state.isRunning, runBlazePoseAsyncOnJS],
  );

  const startCapture = useCallback(() => {
    bufferRef.current.reset();
    repCounterRef.current.reset();
    frameIndexRef.current = 0;
    windowStartRef.current = 0;
    fpsTimestampsRef.current = [];
    inferenceInFlightRef.current = false;
    smoothedLandmarksRef.current = null;
    lastLandmarkUiUpdateRef.current = 0;
    poseInFlight.value = false;
    setState(s => ({
      ...s,
      isRunning: true,
      repCount: 0,
      error: null,
      fps: 0,
      landmarks: null,
    }));
  }, []);

  const stopCapture = useCallback(() => {
    setState(s => ({ ...s, isRunning: false }));
  }, []);

  const resetReps = useCallback(() => {
    repCounterRef.current.reset();
    frameIndexRef.current = 0;
    windowStartRef.current = 0;
    bufferRef.current.reset();
    smoothedLandmarksRef.current = null;
    setState(s => ({ ...s, repCount: 0, landmarks: null }));
  }, []);

  return {
    state,
    frameProcessor,
    startCapture,
    stopCapture,
    resetReps,
  };
}
