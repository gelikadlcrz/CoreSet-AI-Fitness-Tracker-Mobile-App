/**
 * STGCNRunner
 *
 * Wraps the INT8-quantized ST-GCN TFLite model.
 * Uses react-native-fast-tflite for zero-copy GPU/NNAPI delegation.
 *
 * Model I/O contract (derived from training):
 *   Input  : Float32 [1, T, V, C] = [1, 30, 33, 3]  (after INT8 dequantisation)
 *   Output 0: Float32 [1, 4]        (classification logits: squat, pushup, bench, pullup)
 *   Output 1: Float32 [1, T]        (density map over time)
 *
 * INT8 quantisation:
 *   The TFLite runtime handles dequantisation automatically when the input
 *   tensor dtype is FLOAT32 — we pass float32 and the delegate converts.
 */

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';
import { WINDOW_SIZE, FEATURE_DIM } from '../utils/temporalBuffer';
import { NUM_JOINTS } from '../../../ml/graph/adjacencyMatrix';

export const CLASS_LABELS = ['squat', 'pushup', 'benchpress', 'pullup'] as const;
export type ExerciseClass = typeof CLASS_LABELS[number];

export interface STGCNOutput {
  /** Predicted exercise class */
  exerciseClass: ExerciseClass;
  /** Softmax confidence for each class */
  classProbs: number[];
  /** Raw density map over T frames (sums to rep count) */
  densityMap: number[];
  /** Estimated rep count from density integral */
  repCount: number;
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

export class STGCNRunner {
  private model: TensorflowModel | null = null;
  private static instance: STGCNRunner | null = null;

  static getInstance(): STGCNRunner {
    if (!STGCNRunner.instance) STGCNRunner.instance = new STGCNRunner();
    return STGCNRunner.instance;
  }

  async load(): Promise<void> {
    if (this.model) return;

    // Resolve the bundled TFLite asset
   const asset = Asset.fromModule(
      require('../../../ml/models/stgcn_int8.tflite')
    );
    await asset.downloadAsync();

    this.model = await loadTensorflowModel(
      { url: asset.localUri! },
      'default',
    );
  }

  /**
   * Run inference on a pre-built window tensor.
   *
   * @param windowTensor Float32Array of shape [T * V * C] (T=30, V=33, C=3)
   *   Layout: frame-major, i.e. index = t*V*C + v*C + c
   */
  async run(windowTensor: Float32Array): Promise<STGCNOutput> {
    if (!this.model) throw new Error('STGCNRunner: model not loaded. Call load() first.');

    const expectedLen = WINDOW_SIZE * NUM_JOINTS * 3;
    if (windowTensor.length !== expectedLen) {
      throw new Error(`Expected tensor of length ${expectedLen}, got ${windowTensor.length}`);
    }

    // Run inference — react-native-fast-tflite accepts typed arrays directly
    const outputs = await this.model.run([windowTensor]);

    // --- Classification head ---
    const logits = Array.from(outputs[0] as Float32Array);
    const classProbs = softmax(logits);
    const classIdx = classProbs.indexOf(Math.max(...classProbs));
    const exerciseClass = CLASS_LABELS[classIdx];

    // --- Density-map head ---
    const densityMap = Array.from(outputs[1] as Float32Array);

    // Rep count = integral of density map (sum, as per density-map training convention)
    const repCount = Math.max(0, densityMap.reduce((a, b) => a + b, 0));

    return { exerciseClass, classProbs, densityMap, repCount };
  }

  dispose(): void {
    // react-native-fast-tflite models are GC'd; no explicit dispose needed
    this.model = null;
    STGCNRunner.instance = null;
  }
}