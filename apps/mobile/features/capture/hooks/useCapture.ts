import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';

import { usePoseDetection } from 'react-native-mediapipe/src/poseDetection';

import {
  Delegate,
  RunningMode,
} from 'react-native-mediapipe/src/shared/types';

import {
  normalisePose,
  type Landmark3D,
} from '../../../ml/preprocessing/normalizePose';

import { TemporalBuffer, WINDOW_SIZE } from '../utils/temporalBuffer';
import { STGCNRunner, type ExerciseClass } from '../inference/STGCNRunner';
import { RepCounter, type RepEvent } from '../postprocessing/RepCounter';

const MODEL_NAME = 'pose_landmarker_full.task';

const STRIDE = Math.floor(WINDOW_SIZE / 2);
const LANDMARK_UI_UPDATE_MS = 80;
const LANDMARK_SMOOTHING_ALPHA = 0.35;

type RawLandmarks = Landmark3D[];

export interface CaptureState {
  isReady: boolean;
  isRunning: boolean;
  repCount: number;
  exerciseClass: ExerciseClass | null;
  classConfidence: number;
  fps: number;
  error: string | null;
  landmarks: RawLandmarks | null;
  frameSize: { width: number; height: number } | null;
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
  frameSize: null,
};

function isLandmarkArray(value: any): value is RawLandmarks {
  return (
    Array.isArray(value) &&
    value.length === 33 &&
    typeof value[0]?.x === 'number' &&
    typeof value[0]?.y === 'number'
  );
}

function extractMediaPipeLandmarks(result: any): RawLandmarks {
  const candidates = [
    result?.results?.[0]?.landmarks?.[0],
    result?.results?.[0]?.poseLandmarks?.[0],
    result?.landmarks?.[0],
    result?.poseLandmarks?.[0],
    result?.landmarks,
    result?.poseLandmarks,
  ];

  for (const item of candidates) {
    if (isLandmarkArray(item)) {
      return item.map((point) => ({
        x: point.x,
        y: point.y,
        z: point.z ?? 0,
        visibility: point.visibility ?? point.presence ?? 1,
      }));
    }
  }

  return [];
}

function isMediaPipeFrameUsable(landmarks: RawLandmarks): boolean {
  if (landmarks.length !== 33) {
    return false;
  }

  const reliableCount = landmarks.filter((point) => {
    const visibility = point.visibility ?? 1;

    return visibility >= 0.35;
  }).length;

  const requiredJoints = [
    11, // left shoulder
    12, // right shoulder
    13, // left elbow
    14, // right elbow
    15, // left wrist
    16, // right wrist
    23, // left hip
    24, // right hip
  ];

  const requiredVisible = requiredJoints.every((index) => {
    const point = landmarks[index];

    return (
      Number.isFinite(point?.x) &&
      Number.isFinite(point?.y) &&
      Number.isFinite(point?.z) &&
      (point?.visibility ?? 0) >= 0.3
    );
  });

  return reliableCount >= 16 && requiredVisible;
}

function smoothLandmarks(
  prev: RawLandmarks | null,
  current: RawLandmarks
): RawLandmarks {
  if (!prev || prev.length !== current.length) {
    return current;
  }

  return current.map((lm, idx) => {
    const prevLm = prev[idx];

    if (
      !Number.isFinite(lm.x) ||
      !Number.isFinite(lm.y) ||
      !Number.isFinite(lm.z)
    ) {
      return prevLm;
    }

    if (
      !Number.isFinite(prevLm.x) ||
      !Number.isFinite(prevLm.y) ||
      !Number.isFinite(prevLm.z)
    ) {
      return lm;
    }

    return {
      x: prevLm.x + (lm.x - prevLm.x) * LANDMARK_SMOOTHING_ALPHA,
      y: prevLm.y + (lm.y - prevLm.y) * LANDMARK_SMOOTHING_ALPHA,
      z: prevLm.z + (lm.z - prevLm.z) * LANDMARK_SMOOTHING_ALPHA,
      visibility:
        (prevLm.visibility ?? 0) * (1 - LANDMARK_SMOOTHING_ALPHA) +
        (lm.visibility ?? 0) * LANDMARK_SMOOTHING_ALPHA,
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
  const isRunningRef = useRef(false);

  useEffect(() => {
    isRunningRef.current = state.isRunning;
  }, [state.isRunning]);

  useEffect(() => {
    let cancelled = false;

    stgcnRunnerRef.current
      .load()
      .then(() => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            isReady: true,
          }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            error: `Model load failed: ${err?.message ?? err}`,
          }));
        }
      });

    const unsubRep = repCounterRef.current.onRep((event: RepEvent) => {
      setState((s) => ({
        ...s,
        repCount: event.repNumber,
      }));
    });

    return () => {
      cancelled = true;
      unsubRep();
    };
  }, []);

  const updateClassification = useCallback(
    (exerciseClass: ExerciseClass, confidence: number) => {
      setState((s) => ({
        ...s,
        exerciseClass,
        classConfidence: confidence,
      }));
    },
    []
  );

  const updateFps = useCallback((fps: number) => {
    setState((s) => ({
      ...s,
      fps,
    }));
  }, []);

  const reportError = useCallback((msg: string) => {
    setState((s) => ({
      ...s,
      error: msg,
    }));
  }, []);

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
    [updateClassification, reportError]
  );

  const onLandmarksReady = useCallback(
    (landmarks: RawLandmarks) => {
      if (!isRunningRef.current) {
        return;
      }

      if (!isMediaPipeFrameUsable(landmarks)) {
        return;
      }

      const smoothedLandmarks = smoothLandmarks(
        smoothedLandmarksRef.current,
        landmarks
      );

      smoothedLandmarksRef.current = smoothedLandmarks;

      const featureVec = normalisePose(smoothedLandmarks);
      bufferRef.current.push(featureVec);

      const frameIdx = ++frameIndexRef.current;
      const now = Date.now();

      const { width, height } = Dimensions.get('window');
      const frameSize = { width, height };

      if (now - lastLandmarkUiUpdateRef.current >= LANDMARK_UI_UPDATE_MS) {
        lastLandmarkUiUpdateRef.current = now;

        setState((s) => ({
          ...s,
          landmarks: smoothedLandmarks,
          frameSize,
        }));
      }

      fpsTimestampsRef.current.push(now);
      fpsTimestampsRef.current = fpsTimestampsRef.current.filter(
        (timestamp) => now - timestamp < 1000
      );

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
    [runStgcn, updateFps]
  );

  const callbacks = useMemo(
    () => ({
      onResults: (result: any) => {
        const landmarks = extractMediaPipeLandmarks(result);

        if (landmarks.length === 33) {
          onLandmarksReady(landmarks);
        }
      },

      onError: (error: any) => {
        console.log('MediaPipe capture error:', error);
        reportError(`MediaPipe error: ${String(error?.message ?? error)}`);
      },
    }),
    [onLandmarksReady, reportError]
  );

  const mediaPipeSolution = usePoseDetection(
    callbacks,
    RunningMode.LIVE_STREAM,
    MODEL_NAME,
    {
      numPoses: 1,
      delegate: Delegate.CPU,
      minPoseDetectionConfidence: 0.3,
      minPosePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
      shouldOutputSegmentationMasks: false,
    }
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
    isRunningRef.current = true;

    setState((s) => ({
      ...s,
      isRunning: true,
      repCount: 0,
      error: null,
      fps: 0,
      landmarks: null,
      frameSize: null,
    }));
  }, []);

  const stopCapture = useCallback(() => {
    isRunningRef.current = false;

    setState((s) => ({
      ...s,
      isRunning: false,
    }));
  }, []);

  const resetReps = useCallback(() => {
    repCounterRef.current.reset();

    frameIndexRef.current = 0;
    windowStartRef.current = 0;
    bufferRef.current.reset();
    smoothedLandmarksRef.current = null;

    setState((s) => ({
      ...s,
      repCount: 0,
      landmarks: null,
      frameSize: null,
    }));
  }, []);

  return {
    state,
    mediaPipeSolution,
    startCapture,
    stopCapture,
    resetReps,
  };
}