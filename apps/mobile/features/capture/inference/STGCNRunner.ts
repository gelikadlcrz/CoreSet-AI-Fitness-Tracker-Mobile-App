/**
 * STGCNRunner
 *
 * Wraps the deployed ST-GCN TFLite model.
 */

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

import { WINDOW_SIZE, FEATURE_DIM } from '../utils/temporalBuffer';
import { NUM_JOINTS } from '../../../ml/graph/adjacencyMatrix';

export const CLASS_LABELS = [
  'squat',
  'push_up',
  'bench_press',
  'pull_up',
] as const;

export type ExerciseClass = typeof CLASS_LABELS[number];

export interface STGCNOutput {
  exerciseClass: ExerciseClass;
  classProbs: number[];
  densityMap: number[];
  repCount: number;
}

function softmax(logits: number[]): number[] {
  const finite = logits.map((value) => (Number.isFinite(value) ? value : 0));
  const max = Math.max(...finite);
  const exps = finite.map((value) => Math.exp(value - max));
  const sum = exps.reduce((total, value) => total + value, 0) || 1;

  return exps.map((value) => value / sum);
}

function toNumberArray(output: unknown): number[] {
  if (ArrayBuffer.isView(output)) {
    return Array.from(output as ArrayLike<number>).map((value) =>
      Number(value)
    );
  }

  if (Array.isArray(output)) {
    return output.map((value) => Number(value));
  }

  return [];
}

export class STGCNRunner {
  private model: TensorflowModel | null = null;
  private static instance: STGCNRunner | null = null;

  static getInstance(): STGCNRunner {
    if (!STGCNRunner.instance) {
      STGCNRunner.instance = new STGCNRunner();
    }

    return STGCNRunner.instance;
  }

  async load(): Promise<void> {
    if (this.model) {
      return;
    }

    const asset = Asset.fromModule(
      require('../../../ml/models/stgcn_int8.tflite')
    );

    await asset.downloadAsync();

    this.model = await loadTensorflowModel(
      {
        url: asset.localUri!,
      },
      'default'
    );

    const modelAny = this.model as any;

    console.log('STGCN loaded', {
      inputs: modelAny?.inputs,
      outputs: modelAny?.outputs,
    });
  }

  async run(windowTensor: Float32Array): Promise<STGCNOutput> {
    if (!this.model) {
      throw new Error('STGCNRunner: model not loaded. Call load() first.');
    }

    const expectedLen = FEATURE_DIM * WINDOW_SIZE * NUM_JOINTS * 1;

    if (windowTensor.length !== expectedLen) {
      throw new Error(
        `Expected tensor of length ${expectedLen}, got ${windowTensor.length}`
      );
    }

    const rawOutputs = await this.model.run([windowTensor]);
    const outputs = rawOutputs.map(toNumberArray);

    const classOutput =
      outputs.find((output) => output.length === CLASS_LABELS.length) ??
      outputs[0] ??
      [];

    const densityOutput =
      outputs.find(
        (output) => output.length !== CLASS_LABELS.length && output.length > 0
      ) ??
      outputs[1] ??
      [];

    const classProbs = softmax(classOutput);
    const classIdx = classProbs.indexOf(Math.max(...classProbs));
    const exerciseClass = CLASS_LABELS[classIdx] ?? 'pull_up';

    const densityMap = densityOutput.map((value) =>
      Number.isFinite(value) ? value : 0
    );

    const repCount = Math.max(
      0,
      densityMap.reduce((total, value) => total + Math.max(0, value), 0)
    );

    const maxDensity = densityMap.length ? Math.max(...densityMap) : 0;
    const minDensity = densityMap.length ? Math.min(...densityMap) : 0;

    console.log(
      `STGCN raw: outputLens=${outputs
        .map((output) => output.length)
        .join(',')}, class=${exerciseClass}, probs=${classProbs
        .map((probability) => probability.toFixed(2))
        .join('/')}, densityRange=${minDensity.toFixed(
        3
      )}..${maxDensity.toFixed(3)}`
    );

    return {
      exerciseClass,
      classProbs,
      densityMap,
      repCount,
    };
  }

  dispose(): void {
    this.model = null;
    STGCNRunner.instance = null;
  }
}