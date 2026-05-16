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

const MIN_CLASS_CONFIDENCE_FOR_REPS = 0.7;
const MIN_STABLE_CLASS_WINDOWS = 3;
const MIN_WINDOW_MOTION_FOR_REPS = 0.0003;

type RawLandmarks = Landmark3D[];

type PosePacket = {
  imageLandmarks: RawLandmarks;
  worldLandmarks: RawLandmarks;
};

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

function toRawLandmarks(value: any): RawLandmarks {
  return value.map((point: any) => ({
    x: point.x,
    y: point.y,
    z: point.z ?? 0,
    visibility: point.visibility ?? point.presence ?? 1,
  }));
}

function extractMediaPipePosePacket(result: any): PosePacket | null {
  const imageCandidates = [
    result?.results?.[0]?.landmarks?.[0],
    result?.results?.[0]?.poseLandmarks?.[0],
    result?.landmarks?.[0],
    result?.poseLandmarks?.[0],
    result?.landmarks,
    result?.poseLandmarks,
  ];

  const worldCandidates = [
    result?.results?.[0]?.worldLandmarks?.[0],
    result?.worldLandmarks?.[0],
    result?.worldLandmarks,
  ];

  let imageLandmarks: RawLandmarks | null = null;
  let worldLandmarks: RawLandmarks | null = null;

  for (const item of imageCandidates) {
    if (isLandmarkArray(item)) {
      imageLandmarks = toRawLandmarks(item);
      break;
    }
  }

  for (const item of worldCandidates) {
    if (isLandmarkArray(item)) {
      worldLandmarks = toRawLandmarks(item);
      break;
    }
  }

  if (!imageLandmarks || !worldLandmarks) {
    return null;
  }

  return {
    imageLandmarks,
    worldLandmarks,
  };
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
    11,
    12,
    13,
    14,
    15,
    16,
    23,
    24,
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
  previous: RawLandmarks | null,
  current: RawLandmarks
): RawLandmarks {
  if (!previous || previous.length !== current.length) {
    return current;
  }

  return current.map((landmark, index) => {
    const previousLandmark = previous[index];

    if (
      !Number.isFinite(landmark.x) ||
      !Number.isFinite(landmark.y) ||
      !Number.isFinite(landmark.z)
    ) {
      return previousLandmark;
    }

    if (
      !Number.isFinite(previousLandmark.x) ||
      !Number.isFinite(previousLandmark.y) ||
      !Number.isFinite(previousLandmark.z)
    ) {
      return landmark;
    }

    return {
      x:
        previousLandmark.x +
        (landmark.x - previousLandmark.x) * LANDMARK_SMOOTHING_ALPHA,
      y:
        previousLandmark.y +
        (landmark.y - previousLandmark.y) * LANDMARK_SMOOTHING_ALPHA,
      z:
        previousLandmark.z +
        (landmark.z - previousLandmark.z) * LANDMARK_SMOOTHING_ALPHA,
      visibility:
        (previousLandmark.visibility ?? 0) * (1 - LANDMARK_SMOOTHING_ALPHA) +
        (landmark.visibility ?? 0) * LANDMARK_SMOOTHING_ALPHA,
    };
  });
}

function computeFeatureMotion(
  previous: Float32Array | null,
  current: Float32Array
): number {
  if (!previous || previous.length !== current.length) {
    return 0;
  }

  let total = 0;
  let count = 0;

  for (let index = 0; index < current.length; index++) {
    const prevValue = previous[index];
    const currentValue = current[index];

    if (Number.isFinite(prevValue) && Number.isFinite(currentValue)) {
      total += Math.abs(currentValue - prevValue);
      count++;
    }
  }

  return count > 0 ? total / count : 0;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
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

  const smoothedModelLandmarksRef = useRef<RawLandmarks | null>(null);
  const smoothedOverlayLandmarksRef = useRef<RawLandmarks | null>(null);

  const previousFeatureVectorRef = useRef<Float32Array | null>(null);
  const motionScoresRef = useRef<number[]>([]);

  const lastLandmarkUiUpdateRef = useRef(0);
  const isRunningRef = useRef(false);

  const stableClassRef = useRef<ExerciseClass | null>(null);
  const stableClassCountRef = useRef(0);
  const lastWindowMotionRef = useRef(0);

  useEffect(() => {
    isRunningRef.current = state.isRunning;
  }, [state.isRunning]);

  useEffect(() => {
    let cancelled = false;

    stgcnRunnerRef.current
      .load()
      .then(() => {
        if (!cancelled) {
          setState((currentState) => ({
            ...currentState,
            isReady: true,
          }));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState((currentState) => ({
            ...currentState,
            error: `Model load failed: ${error?.message ?? error}`,
          }));
        }
      });

    const unsubscribeRep = repCounterRef.current.onRep((event: RepEvent) => {
      setState((currentState) => ({
        ...currentState,
        repCount: event.repNumber,
      }));
    });

    return () => {
      cancelled = true;
      unsubscribeRep();
    };
  }, []);

  const updateClassification = useCallback(
    (exerciseClass: ExerciseClass, confidence: number) => {
      setState((currentState) => ({
        ...currentState,
        exerciseClass,
        classConfidence: confidence,
      }));
    },
    []
  );

  const updateFps = useCallback((fps: number) => {
    setState((currentState) => ({
      ...currentState,
      fps,
    }));
  }, []);

  const reportError = useCallback((message: string) => {
    setState((currentState) => ({
      ...currentState,
      error: message,
    }));
  }, []);

  const runStgcn = useCallback(
    async (windowTensor: Float32Array, windowStart: number) => {
      try {
        const result = await stgcnRunnerRef.current.run(windowTensor);
        const confidence = Math.max(...result.classProbs);

        if (stableClassRef.current === result.exerciseClass) {
          stableClassCountRef.current += 1;
        } else {
          stableClassRef.current = result.exerciseClass;
          stableClassCountRef.current = 1;
        }

        updateClassification(result.exerciseClass, confidence);

        const isStableClass =
          stableClassCountRef.current >= MIN_STABLE_CLASS_WINDOWS;

        const isConfident = confidence >= MIN_CLASS_CONFIDENCE_FOR_REPS;
        const hasRealMotion =
          lastWindowMotionRef.current >= MIN_WINDOW_MOTION_FOR_REPS;

        if (isStableClass && isConfident && hasRealMotion) {
          repCounterRef.current.processWindow(result.densityMap, windowStart);
        } else {
          console.log(
            `Rep skipped: class=${
              result.exerciseClass
            }, confidence=${confidence.toFixed(2)}, stable=${
              stableClassCountRef.current
            }, motion=${lastWindowMotionRef.current.toFixed(4)}`
          );
        }
      } catch (error: any) {
        reportError(error?.message ?? 'ST-GCN inference error');
      } finally {
        inferenceInFlightRef.current = false;
      }
    },
    [updateClassification, reportError]
  );

  const onPosePacketReady = useCallback(
    (packet: PosePacket) => {
      if (!isRunningRef.current) {
        return;
      }

      if (!isMediaPipeFrameUsable(packet.imageLandmarks)) {
        return;
      }

      const smoothedModelLandmarks = smoothLandmarks(
        smoothedModelLandmarksRef.current,
        packet.worldLandmarks
      );

      const smoothedOverlayLandmarks = smoothLandmarks(
        smoothedOverlayLandmarksRef.current,
        packet.imageLandmarks
      );

      smoothedModelLandmarksRef.current = smoothedModelLandmarks;
      smoothedOverlayLandmarksRef.current = smoothedOverlayLandmarks;

      const featureVector = normalisePose(smoothedModelLandmarks);

      const motionScore = computeFeatureMotion(
        previousFeatureVectorRef.current,
        featureVector
      );

      previousFeatureVectorRef.current = featureVector;

      motionScoresRef.current.push(motionScore);

      if (motionScoresRef.current.length > WINDOW_SIZE) {
        motionScoresRef.current.shift();
      }

      lastWindowMotionRef.current = average(motionScoresRef.current);

      bufferRef.current.push(featureVector);

      const frameIndex = ++frameIndexRef.current;
      const now = Date.now();

      const { width, height } = Dimensions.get('window');
      const frameSize = {
        width,
        height,
      };

      if (now - lastLandmarkUiUpdateRef.current >= LANDMARK_UI_UPDATE_MS) {
        lastLandmarkUiUpdateRef.current = now;

        setState((currentState) => ({
          ...currentState,
          landmarks: smoothedOverlayLandmarks,
          frameSize,
        }));
      }

      fpsTimestampsRef.current.push(now);
      fpsTimestampsRef.current = fpsTimestampsRef.current.filter(
        (timestamp) => now - timestamp < 1000
      );

      if (frameIndex % 15 === 0) {
        updateFps(fpsTimestampsRef.current.length);
      }

      if (
        frameIndex % STRIDE === 0 &&
        bufferRef.current.size >= WINDOW_SIZE &&
        !inferenceInFlightRef.current
      ) {
        inferenceInFlightRef.current = true;

        const windowTensor = bufferRef.current.getWindow();

        // The TemporalBuffer always contains the latest WINDOW_SIZE frames.
        // So the current window starts at frameIndex - WINDOW_SIZE.
        // This prevents duplicate rep peaks from overlapping windows.
        const windowStart = Math.max(0, frameIndex - WINDOW_SIZE);

        runStgcn(windowTensor, windowStart);

        console.log(
          `STGCN gate: windowMotion=${lastWindowMotionRef.current.toFixed(4)}`
        );

        runStgcn(windowTensor, windowStart);
      }
    },
    [runStgcn, updateFps]
  );

  const callbacks = useMemo(
    () => ({
      onResults: (result: any) => {
        const posePacket = extractMediaPipePosePacket(result);

        if (posePacket) {
          onPosePacketReady(posePacket);
        }
      },

      onError: (error: any) => {
        console.log('MediaPipe capture error:', error);
        reportError(`MediaPipe error: ${String(error?.message ?? error)}`);
      },
    }),
    [onPosePacketReady, reportError]
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

    smoothedModelLandmarksRef.current = null;
    smoothedOverlayLandmarksRef.current = null;

    previousFeatureVectorRef.current = null;
    motionScoresRef.current = [];
    lastWindowMotionRef.current = 0;

    lastLandmarkUiUpdateRef.current = 0;
    isRunningRef.current = true;

    stableClassRef.current = null;
    stableClassCountRef.current = 0;

    setState((currentState) => ({
      ...currentState,
      isRunning: true,
      repCount: 0,
      error: null,
      fps: 0,
      landmarks: null,
      frameSize: null,
      exerciseClass: null,
      classConfidence: 0,
    }));
  }, []);

  const stopCapture = useCallback(() => {
    isRunningRef.current = false;

    setState((currentState) => ({
      ...currentState,
      isRunning: false,
    }));
  }, []);

  const resetReps = useCallback(() => {
    repCounterRef.current.reset();

    frameIndexRef.current = 0;
    windowStartRef.current = 0;
    bufferRef.current.reset();

    smoothedModelLandmarksRef.current = null;
    smoothedOverlayLandmarksRef.current = null;

    previousFeatureVectorRef.current = null;
    motionScoresRef.current = [];
    lastWindowMotionRef.current = 0;

    stableClassRef.current = null;
    stableClassCountRef.current = 0;

    setState((currentState) => ({
      ...currentState,
      repCount: 0,
      landmarks: null,
      frameSize: null,
      exerciseClass: null,
      classConfidence: 0,
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