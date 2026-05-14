import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';
import type { Frame } from 'react-native-vision-camera';
import { Landmark3D } from '../../../ml/preprocessing/normalizePose';
import { NUM_JOINTS } from '../../../ml/graph/adjacencyMatrix';

const LANDMARK_INPUT_SIZE = 256;
const COORDS_PER_LM = 5;
const USED_LANDMARKS = NUM_JOINTS;

const VISIBILITY_THRESHOLD = 0.2;
const PRESENCE_THRESHOLD = 0.15;
const POSE_PRESENCE_MIN = 0.08;

export type RawLandmarks = Landmark3D[];

let landmarkModel: TensorflowModel | null = null;

export async function loadBlazePose(): Promise<void> {
  if (landmarkModel) return;

  const lmAsset = Asset.fromModule(require('../../../ml/models/blazepose_v2.tflite'));
  await lmAsset.downloadAsync();

  landmarkModel = await loadTensorflowModel({ url: lmAsset.localUri! }, 'default');
}

export function isBlazePoseLoaded(): boolean {
  return landmarkModel !== null;
}

export function disposeBlazePose(): void {
  landmarkModel = null;
}

function frameToLandmarkTensor(frame: Frame): Float32Array {
  'worklet';

  const { width, height } = frame;
  const buffer = (frame as any).toArrayBuffer();
  const src = new Uint8Array(buffer);
  const out = new Float32Array(LANDMARK_INPUT_SIZE * LANDMARK_INPUT_SIZE * 3);
  const pixelFormat: string = (frame as any).pixelFormat ?? 'rgba-8888';

  const scaleX = width / LANDMARK_INPUT_SIZE;
  const scaleY = height / LANDMARK_INPUT_SIZE;

  for (let dy = 0; dy < LANDMARK_INPUT_SIZE; dy++) {
    for (let dx = 0; dx < LANDMARK_INPUT_SIZE; dx++) {
      const sx = Math.min(Math.floor(dx * scaleX), width - 1);
      const sy = Math.min(Math.floor(dy * scaleY), height - 1);

      let r: number;
      let g: number;
      let b: number;

      if (pixelFormat === 'yuv' || pixelFormat === 'yuv-420-888') {
        const uvW = Math.floor(width / 2);
        const uvH = Math.floor(height / 2);
        const yIdx = sy * width + sx;
        const uIdx = width * height + Math.floor(sy / 2) * uvW + Math.floor(sx / 2);
        const vIdx = uIdx + uvW * uvH;
        const Y = src[yIdx];
        const U = (src[uIdx] ?? 128) - 128;
        const V = (src[vIdx] ?? 128) - 128;
        r = Math.max(0, Math.min(255, Y + 1.402 * V));
        g = Math.max(0, Math.min(255, Y - 0.344 * U - 0.714 * V));
        b = Math.max(0, Math.min(255, Y + 1.772 * U));
      } else if (pixelFormat === 'bgra-8888') {
        const pIdx = (sy * width + sx) * 4;
        b = src[pIdx];
        g = src[pIdx + 1];
        r = src[pIdx + 2];
      } else {
        const pIdx = (sy * width + sx) * 4;
        r = src[pIdx];
        g = src[pIdx + 1];
        b = src[pIdx + 2];
      }

      const outIdx = (dy * LANDMARK_INPUT_SIZE + dx) * 3;
      out[outIdx] = r / 255.0;
      out[outIdx + 1] = g / 255.0;
      out[outIdx + 2] = b / 255.0;
    }
  }

  return out;
}

export function parseLandmarkTensor(landmarkTensor: Float32Array, posePresence: number): RawLandmarks {
  if (posePresence < POSE_PRESENCE_MIN) {
    return Array.from({ length: USED_LANDMARKS }, () => ({ x: NaN, y: NaN, z: NaN, visibility: 0 }));
  }

  const landmarks: RawLandmarks = [];

  for (let i = 0; i < USED_LANDMARKS; i++) {
    const base = i * COORDS_PER_LM;
    const x = landmarkTensor[base];
    const y = landmarkTensor[base + 1];
    const z = landmarkTensor[base + 2];
    const visibility = landmarkTensor[base + 3];
    const presence = landmarkTensor[base + 4];

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      landmarks.push({ x: NaN, y: NaN, z: NaN, visibility: 0 });
      continue;
    }

    landmarks.push({
      x,
      y,
      z,
      visibility: visibility >= VISIBILITY_THRESHOLD && presence >= PRESENCE_THRESHOLD ? visibility : Math.max(visibility, 0),
    });
  }

  return landmarks;
}

export async function frameToInputTensor(frame: Frame): Promise<Float32Array> {
  return frameToLandmarkTensor(frame);
}

export async function detectPose(inputTensor: Float32Array): Promise<RawLandmarks> {
  if (!landmarkModel) throw new Error('Landmark model not loaded.');

  const outputs = await landmarkModel.run([inputTensor]);
  const landmarkTensor = outputs[0] as Float32Array;
  const presenceTensor = outputs[1] as Float32Array;
  const posePresence = Number.isFinite(presenceTensor?.[0]) ? presenceTensor[0] : 0;

  console.log(`Presence: ${posePresence.toFixed(3)}, landmarks: ${landmarkTensor.length}`);

  return parseLandmarkTensor(landmarkTensor, posePresence);
}

export function isFrameUsable(landmarks: RawLandmarks): boolean {
  const visible = landmarks.filter(lm => Number.isFinite(lm.x) && (lm.visibility ?? 0) > 0.1).length;
  return visible >= Math.floor(USED_LANDMARKS * 0.5);
}
