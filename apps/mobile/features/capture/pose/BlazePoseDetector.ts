/**
 * BlazePoseDetector
 *
 * Runs MediaPipe BlazePose (Full) entirely through react-native-fast-tflite.
 * No external native plugin required — uses the bundled blazepose.tflite model.
 *
 * Model: blazepose.tflite (full, integer-quantised)
 *   Input  : FLOAT32 [1, 256, 256, 3]  — RGB image, normalised to [0, 1]
 *   Output 0: FLOAT32 [1, 195]         — 39 landmarks × 5 (x, y, z, visibility, presence)
 *             The first 33 are world-coordinate body landmarks used by ST-GCN.
 *   Output 1: FLOAT32 [1, 1]           — overall pose presence score
 *
 * Frame pre-processing:
 *   Vision Camera delivers frames as YUV_420_888 (Android) or BGRA_8888 (iOS).
 *   We convert to normalised RGB float32 [256×256×3] entirely in JS.
 *   This is fast enough at 30 fps because the heavy lifting (BlazePose + ST-GCN)
 *   runs on NNAPI/GPU via fast-tflite, not on the JS thread.
 */

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';
import type { Frame } from 'react-native-vision-camera';
import { Landmark3D } from '../../../ml/preprocessing/normalizePose';
import { NUM_JOINTS } from '../../../ml/graph/adjacencyMatrix';

// ─── Constants ───────────────────────────────────────────────────────────────

const MODEL_INPUT_SIZE   = 256;
const LANDMARK_COUNT     = 39;
const COORDS_PER_LM      = 5;   // x, y, z, visibility, presence
const USED_LANDMARKS     = NUM_JOINTS; // first 33 of the 39 output landmarks

const VISIBILITY_THRESHOLD = 0.5;
const PRESENCE_THRESHOLD   = 0.5;
const POSE_PRESENCE_MIN    = 0.5;

export type RawLandmarks = Landmark3D[];

// ─── Singleton model ──────────────────────────────────────────────────────────

let blazePoseModel: TensorflowModel | null = null;

export async function loadBlazePose(): Promise<void> {
  if (blazePoseModel) return;

  const [asset] = await Asset.loadAsync(
    require('../../../ml/models/blazepose.tflite')
  );

  blazePoseModel = await loadTensorflowModel(
    { url: asset.localUri! },
    'core-ml',
  );
}

export function isBlazePoseLoaded(): boolean {
  return blazePoseModel !== null;
}

export function disposeBlazePose(): void {
  blazePoseModel = null;
}

// ─── Frame → input tensor ─────────────────────────────────────────────────────

/**
 * Converts a Vision Camera Frame into a flat Float32Array [256*256*3].
 *
 * Handles both YUV_420_888 (Android) and BGRA_8888 (iOS) via the
 * frame.pixelFormat property exposed by Vision Camera v4.
 */
export function frameToInputTensor(frame: Frame): Float32Array {
  const { width, height } = frame;
  const pixelFormat: string = (frame as any).pixelFormat ?? 'rgba-8888';
  const buffer: ArrayBuffer = (frame as any).toArrayBuffer();
  const src = new Uint8Array(buffer);

  const out = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
  const scaleX = width  / MODEL_INPUT_SIZE;
  const scaleY = height / MODEL_INPUT_SIZE;

  for (let dy = 0; dy < MODEL_INPUT_SIZE; dy++) {
    for (let dx = 0; dx < MODEL_INPUT_SIZE; dx++) {
      const sx = Math.min(Math.floor(dx * scaleX), width  - 1);
      const sy = Math.min(Math.floor(dy * scaleY), height - 1);

      let r: number, g: number, b: number;

      if (pixelFormat === 'yuv' || pixelFormat === 'yuv-420-888') {
        // ── YUV_420_888 (Android) ──────────────────────────────────────────
        // Y plane: width*height bytes
        // U plane: (width/2)*(height/2) bytes, starting at width*height
        // V plane: (width/2)*(height/2) bytes, following U
        const uvW = Math.floor(width  / 2);
        const uvH = Math.floor(height / 2);
        const yIdx = sy * width + sx;
        const uIdx = width * height + Math.floor(sy / 2) * uvW + Math.floor(sx / 2);
        const vIdx = uIdx + uvW * uvH;

        const Y = src[yIdx];
        const U = (src[uIdx] ?? 128) - 128;
        const V = (src[vIdx] ?? 128) - 128;

        r = Math.max(0, Math.min(255, Y + 1.402  * V));
        g = Math.max(0, Math.min(255, Y - 0.344  * U - 0.714 * V));
        b = Math.max(0, Math.min(255, Y + 1.772  * U));
      } else {
        // ── BGRA_8888 (iOS) / RGBA_8888 ───────────────────────────────────
        const pIdx = (sy * width + sx) * 4;
        if (pixelFormat === 'bgra-8888') {
          b = src[pIdx];
          g = src[pIdx + 1];
          r = src[pIdx + 2];
        } else {
          // rgba-8888 (default fallback)
          r = src[pIdx];
          g = src[pIdx + 1];
          b = src[pIdx + 2];
        }
      }

      const outIdx = (dy * MODEL_INPUT_SIZE + dx) * 3;
      out[outIdx]     = r / 255.0;
      out[outIdx + 1] = g / 255.0;
      out[outIdx + 2] = b / 255.0;
    }
  }

  return out;
}

// ─── Output tensor → landmarks ────────────────────────────────────────────────

/**
 * Parses the flat [195] landmark tensor into 33 Landmark3D objects.
 * Joints below visibility/presence thresholds are set to NaN for
 * downstream cubic-spline interpolation in the TemporalBuffer.
 */
export function parseLandmarkTensor(
  landmarkTensor: Float32Array,
  posePresence: number,
): RawLandmarks {
  if (posePresence < POSE_PRESENCE_MIN) {
    return Array.from({ length: USED_LANDMARKS }, () => ({
      x: NaN, y: NaN, z: NaN, visibility: 0,
    }));
  }

  const landmarks: RawLandmarks = [];

  for (let i = 0; i < USED_LANDMARKS; i++) {
    const base       = i * COORDS_PER_LM;
    const x          = landmarkTensor[base];
    const y          = landmarkTensor[base + 1];
    const z          = landmarkTensor[base + 2];
    const visibility = landmarkTensor[base + 3];
    const presence   = landmarkTensor[base + 4];

    if (visibility < VISIBILITY_THRESHOLD || presence < PRESENCE_THRESHOLD) {
      landmarks.push({ x: NaN, y: NaN, z: NaN, visibility });
    } else {
      landmarks.push({ x, y, z, visibility });
    }
  }

  return landmarks;
}

// ─── Public inference API ─────────────────────────────────────────────────────

/**
 * Runs BlazePose on a pre-built RGB input tensor.
 * Build the tensor with frameToInputTensor() before calling this.
 */
export async function detectPose(inputTensor: Float32Array): Promise<RawLandmarks> {
  if (!blazePoseModel) {
    throw new Error('BlazePose not loaded. Call loadBlazePose() first.');
  }

  const outputs = await blazePoseModel.run([inputTensor]);

  const landmarkTensor = outputs[0] as Float32Array; // shape [195]
  const presenceTensor = outputs[1] as Float32Array; // shape [1]

  return parseLandmarkTensor(landmarkTensor, presenceTensor[0]);
}

/**
 * Quality gate: require ≥50% visible joints for a usable frame.
 */
export function isFrameUsable(landmarks: RawLandmarks): boolean {
  return landmarks.filter(lm => !isNaN(lm.x)).length >= Math.floor(USED_LANDMARKS * 0.5);
}