import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';
import type { Frame } from 'react-native-vision-camera';
import { Landmark3D } from '../../../ml/preprocessing/normalizePose';
import { NUM_JOINTS } from '../../../ml/graph/adjacencyMatrix';

const LANDMARK_INPUT_SIZE = 256; // blazepose_v2.tflite input
const COORDS_PER_LM = 5;         // x, y, z, visibility, presence
const USED_LANDMARKS = NUM_JOINTS; // first 33 MediaPipe body landmarks

export type RawLandmarks = Landmark3D[];

let landmarkModel: TensorflowModel | null = null;

export async function loadBlazePose(): Promise<void> {
  if (landmarkModel) return;

  const lmAsset = Asset.fromModule(require('../../../ml/models/blazepose_v2.tflite'));
  await lmAsset.downloadAsync();

  // Keep this cross-platform. Do not force 'core-ml' here because Android/Windows
  // teammates cannot use that delegate. The default delegate is the safest shared path.
  landmarkModel = await loadTensorflowModel({ url: lmAsset.localUri! }, 'default');
}

export function isBlazePoseLoaded(): boolean {
  return landmarkModel !== null;
}

export function disposeBlazePose(): void {
  landmarkModel = null;
}

function readRgbFromFrame(
  src: Uint8Array,
  pixelFormat: string,
  width: number,
  height: number,
  sx: number,
  sy: number,
): [number, number, number] {
  'worklet';

  if (pixelFormat === 'yuv' || pixelFormat === 'yuv-420-888') {
    const uvW = Math.floor(width / 2);
    const uvH = Math.floor(height / 2);
    const yIdx = sy * width + sx;
    const uIdx = width * height + Math.floor(sy / 2) * uvW + Math.floor(sx / 2);
    const vIdx = uIdx + uvW * uvH;
    const Y = src[yIdx] ?? 0;
    const U = (src[uIdx] ?? 128) - 128;
    const V = (src[vIdx] ?? 128) - 128;
    const r = Math.max(0, Math.min(255, Y + 1.402 * V));
    const g = Math.max(0, Math.min(255, Y - 0.344 * U - 0.714 * V));
    const b = Math.max(0, Math.min(255, Y + 1.772 * U));
    return [r, g, b];
  }

  if (pixelFormat === 'rgb') {
    const pIdx = (sy * width + sx) * 3;
    return [src[pIdx] ?? 0, src[pIdx + 1] ?? 0, src[pIdx + 2] ?? 0];
  }

  if (pixelFormat === 'bgra-8888') {
    const pIdx = (sy * width + sx) * 4;
    return [src[pIdx + 2] ?? 0, src[pIdx + 1] ?? 0, src[pIdx] ?? 0];
  }

  const pIdx = (sy * width + sx) * 4;
  return [src[pIdx] ?? 0, src[pIdx + 1] ?? 0, src[pIdx + 2] ?? 0];
}

function cropAndResizeForLandmark(
  frame: Frame,
  cx: number,
  cy: number,
  size: number,
): Float32Array {
  'worklet';

  const { width, height } = frame;
  const buffer = (frame as any).toArrayBuffer();
  const src = new Uint8Array(buffer);
  const pixelFormat: string = (frame as any).pixelFormat ?? 'rgba-8888';

  const pad = size * 1.25;
  const x0 = Math.max(0, Math.floor((cx - pad / 2) * width));
  const y0 = Math.max(0, Math.floor((cy - pad / 2) * height));
  const x1 = Math.min(width, Math.floor((cx + pad / 2) * width));
  const y1 = Math.min(height, Math.floor((cy + pad / 2) * height));
  const cropW = Math.max(1, x1 - x0);
  const cropH = Math.max(1, y1 - y0);

  const out = new Float32Array(LANDMARK_INPUT_SIZE * LANDMARK_INPUT_SIZE * 3);
  const scaleX = cropW / LANDMARK_INPUT_SIZE;
  const scaleY = cropH / LANDMARK_INPUT_SIZE;

  for (let dy = 0; dy < LANDMARK_INPUT_SIZE; dy++) {
    for (let dx = 0; dx < LANDMARK_INPUT_SIZE; dx++) {
      const sx = Math.min(x0 + Math.floor(dx * scaleX), width - 1);
      const sy = Math.min(y0 + Math.floor(dy * scaleY), height - 1);
      const [r, g, b] = readRgbFromFrame(src, pixelFormat, width, height, sx, sy);
      const outIdx = (dy * LANDMARK_INPUT_SIZE + dx) * 3;
      out[outIdx] = r / 255.0;
      out[outIdx + 1] = g / 255.0;
      out[outIdx + 2] = b / 255.0;
    }
  }

  return out;
}

export function frameToLandmarkInputTensor(frame: Frame): Float32Array {
  'worklet';

  // Stable cross-platform path for now: feed a 256x256 full-frame square to the
  // landmark model. This avoids the incomplete detector decoder and avoids the
  // old bug where a 224x224 detector tensor was accidentally fed to this model.
  return cropAndResizeForLandmark(frame, 0.5, 0.5, 1.0);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value >= 0 && value <= 1) return value;
  return sigmoid(value);
}

export function parseLandmarkTensor(
  landmarkTensor: Float32Array,
  posePresence: number,
): RawLandmarks {
  const landmarks: RawLandmarks = [];

  for (let i = 0; i < USED_LANDMARKS; i++) {
    const base = i * COORDS_PER_LM;
    const x = landmarkTensor[base];
    const y = landmarkTensor[base + 1];
    const z = landmarkTensor[base + 2];
    const visibilityRaw = landmarkTensor[base + 3];
    const presenceRaw = landmarkTensor[base + 4];

    const isCoordUsable = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
    landmarks.push({
      x: isCoordUsable ? x : NaN,
      y: isCoordUsable ? y : NaN,
      z: isCoordUsable ? z : NaN,
      visibility: Math.max(
        normalizeConfidence(visibilityRaw),
        normalizeConfidence(presenceRaw),
        normalizeConfidence(posePresence),
      ),
    });
  }

  return landmarks;
}

export async function detectPose(inputTensor: Float32Array): Promise<RawLandmarks> {
  if (!landmarkModel) throw new Error('Landmark model not loaded.');

  const outputs = await landmarkModel.run([inputTensor]);
  const landmarkTensor = outputs[0] as Float32Array;
  const presenceTensor = outputs[1] as Float32Array;
  const posePresence = presenceTensor?.[0] ?? 0;

  console.log(
    `Presence: ${Number(posePresence).toFixed(3)}, landmarks: ${landmarkTensor.length}`,
  );

  return parseLandmarkTensor(landmarkTensor, posePresence);
}

export function isFrameUsable(landmarks: RawLandmarks): boolean {
  if (landmarks.length < USED_LANDMARKS) return false;

  const requiredJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24];
  const usable = requiredJoints.filter(i => {
    const lm = landmarks[i];
    return lm && Number.isFinite(lm.x) && Number.isFinite(lm.y) && Number.isFinite(lm.z);
  }).length;

  return usable >= 5;
}
