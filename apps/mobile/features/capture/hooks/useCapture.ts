import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Dimensions, Platform } from 'react-native';

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
const LANDMARK_UI_UPDATE_MS = 33;
const LANDMARK_SMOOTHING_ALPHA = 0.35;

const MIN_CLASS_CONFIDENCE_FOR_REPS = 0.55;
const MIN_STABLE_CLASS_WINDOWS = 2;

const MOTION_WINDOW_FRAMES = 48;

const MIN_REP_MOTION_BY_CLASS: Record<ExerciseClass, number> = {
  bench_press: 0.28,
  pull_up: 0.30,
  push_up: 0.30,
  squat: 0.32,
};

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
  motionScore: number;
  motionThreshold: number;
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
  motionScore: 0,
  motionThreshold: 1,
};

function mapOverlayLandmarksForPlatform(landmarks: RawLandmarks): RawLandmarks {
  if (Platform.OS !== 'android') {
    return landmarks;
  }

  return landmarks.map((point) => ({
    ...point,
    x: 1 - point.x,
    y: point.y,
  }));
}

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

function angleAtJoint(
  a: Landmark3D,
  b: Landmark3D,
  c: Landmark3D
): number {
  const ba = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };

  const bc = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: c.z - b.z,
  };

  const normBa = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const normBc = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (normBa < 1e-9 || normBc < 1e-9) {
    return 0;
  }

  const cosine =
    (ba.x * bc.x + ba.y * bc.y + ba.z * bc.z) / (normBa * normBc);

  return Math.acos(Math.max(-1, Math.min(1, cosine)));
}

function range(values: number[]): number {
  const finite = values.filter((value) => Number.isFinite(value));

  if (finite.length === 0) {
    return 0;
  }

  return Math.max(...finite) - Math.min(...finite);
}

function average(values: number[]): number {
  const finite = values.filter((value) => Number.isFinite(value));

  if (finite.length === 0) {
    return 0;
  }

  return finite.reduce((total, value) => total + value, 0) / finite.length;
}

function getAngleRange(
  frames: RawLandmarks[],
  aIndex: number,
  bIndex: number,
  cIndex: number
): number {
  const values = frames.map((frame) => {
    const a = frame[aIndex];
    const b = frame[bIndex];
    const c = frame[cIndex];

    if (!a || !b || !c) {
      return 0;
    }

    return angleAtJoint(a, b, c);
  });

  return range(values);
}

function getJointYRange(
  frames: RawLandmarks[],
  jointIndex: number
): number {
  const values = frames.map((frame) => frame[jointIndex]?.y ?? 0);
  return range(values);
}

function getExerciseMotionGate(
  exerciseClass: ExerciseClass,
  frames: RawLandmarks[]
) {
  const recentFrames = frames.slice(-MOTION_WINDOW_FRAMES);

  if (recentFrames.length < Math.floor(MOTION_WINDOW_FRAMES * 0.6)) {
    return {
      passed: false,
      score: 0,
      threshold: MIN_REP_MOTION_BY_CLASS[exerciseClass],
    };
  }

  const leftElbowRange = getAngleRange(recentFrames, 11, 13, 15);
  const rightElbowRange = getAngleRange(recentFrames, 12, 14, 16);

  const leftKneeRange = getAngleRange(recentFrames, 23, 25, 27);
  const rightKneeRange = getAngleRange(recentFrames, 24, 26, 28);

  const leftShoulderYRange = getJointYRange(recentFrames, 11);
  const rightShoulderYRange = getJointYRange(recentFrames, 12);

  const leftHipYRange = getJointYRange(recentFrames, 23);
  const rightHipYRange = getJointYRange(recentFrames, 24);

  let score = 0;

  if (exerciseClass === 'squat') {
    const kneeMotion = average([leftKneeRange, rightKneeRange]);
    const hipMotion = average([leftHipYRange, rightHipYRange]) * 4;

    score = Math.max(kneeMotion, hipMotion);
  } else if (exerciseClass === 'push_up' || exerciseClass === 'bench_press') {
    score = average([leftElbowRange, rightElbowRange]);
  } else if (exerciseClass === 'pull_up') {
    const elbowMotion = average([leftElbowRange, rightElbowRange]);
    const shoulderVerticalMotion =
      average([leftShoulderYRange, rightShoulderYRange]) * 4;

    score = Math.max(elbowMotion, shoulderVerticalMotion);
  }

  const threshold = MIN_REP_MOTION_BY_CLASS[exerciseClass];

  return {
    passed: score >= threshold,
    score,
    threshold,
  };
}

export function useCapture() {
  const [state, setState] = useState<CaptureState>(initialState);

  const bufferRef = useRef(new TemporalBuffer(WINDOW_SIZE));
  const repCounterRef = useRef(new RepCounter());
  const stgcnRunnerRef = useRef(STGCNRunner.getInstance());

  const frameIndexRef = useRef(0);
  const fpsTimestampsRef = useRef<number[]>([]);
  const inferenceInFlightRef = useRef(false);

  const smoothedModelLandmarksRef = useRef<RawLandmarks | null>(null);
  const smoothedOverlayLandmarksRef = useRef<RawLandmarks | null>(null);

  const landmarkWindowRef = useRef<RawLandmarks[]>([]);

  const lastLandmarkUiUpdateRef = useRef(0);
  const isRunningRef = useRef(false);

  const stableClassRef = useRef<ExerciseClass | null>(null);
  const stableClassCountRef = useRef(0);

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

        const motionGate = getExerciseMotionGate(
          result.exerciseClass,
          landmarkWindowRef.current
        );

        setState((currentState) => ({
          ...currentState,
          motionScore: motionGate.score,
          motionThreshold: motionGate.threshold,
        }));

        if (isStableClass && isConfident && motionGate.passed) {
          repCounterRef.current.processWindow(result.densityMap, windowStart);
        } else {
          console.log(
            `Rep skipped: class=${result.exerciseClass}, confidence=${confidence.toFixed(
              2
            )}, stable=${stableClassCountRef.current}, motionScore=${motionGate.score.toFixed(
              3
            )}, needed=${motionGate.threshold.toFixed(3)}`
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

      const mappedOverlayLandmarks = mapOverlayLandmarksForPlatform(
        packet.imageLandmarks
      );

      const smoothedOverlayLandmarks = smoothLandmarks(
        smoothedOverlayLandmarksRef.current,
        mappedOverlayLandmarks
      );

      smoothedModelLandmarksRef.current = smoothedModelLandmarks;
      smoothedOverlayLandmarksRef.current = smoothedOverlayLandmarks;

      landmarkWindowRef.current.push(smoothedModelLandmarks);

      if (landmarkWindowRef.current.length > WINDOW_SIZE) {
        landmarkWindowRef.current.shift();
      }

      const featureVector = normalisePose(smoothedModelLandmarks);
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
        const windowStart = Math.max(0, frameIndex - WINDOW_SIZE);

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
    fpsTimestampsRef.current = [];
    inferenceInFlightRef.current = false;

    smoothedModelLandmarksRef.current = null;
    smoothedOverlayLandmarksRef.current = null;
    landmarkWindowRef.current = [];

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
      motionScore: 0,
      motionThreshold: 1,
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
    bufferRef.current.reset();

    smoothedModelLandmarksRef.current = null;
    smoothedOverlayLandmarksRef.current = null;
    landmarkWindowRef.current = [];

    stableClassRef.current = null;
    stableClassCountRef.current = 0;

    setState((currentState) => ({
      ...currentState,
      repCount: 0,
      landmarks: null,
      frameSize: null,
      exerciseClass: null,
      classConfidence: null,
      motionScore: 0,
      motionThreshold: 1,
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