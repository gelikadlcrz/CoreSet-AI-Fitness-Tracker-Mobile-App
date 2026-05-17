/**
 * STGCNRunner
 *
 * Wraps the deployed ST-GCN TFLite model.
 */

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

import { WINDOW_SIZE, FEATURE_DIM } from '../utils/temporalBuffer';
import { NUM_JOINTS } from '../../../../ml/graph/adjacencyMatrix';

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

type QuantInfo = {
  scale: number;
  zeroPoint: number;
} | null;

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

function getTensorName(info: any): string {
  return String(info?.name ?? info?.tensorName ?? '');
}

function getTensorDtype(info: any): string {
  return String(
    info?.dataType ??
      info?.dtype ??
      info?.type ??
      info?.tensorType ??
      ''
  ).toLowerCase();
}

function getQuantInfo(info: any): QuantInfo {
  const candidates = [
    info?.quantization,
    info?.quantizationParameters,
    info?.quantizationParams,
    info?.params,
    info,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const rawScale =
      candidate.scale ??
      candidate.scales?.[0] ??
      candidate.quantizationScale ??
      candidate.quantization?.scale;

    const rawZeroPoint =
      candidate.zeroPoint ??
      candidate.zero_point ??
      candidate.zeroPoints?.[0] ??
      candidate.quantizationZeroPoint ??
      candidate.quantization?.zeroPoint;

    const scale = Number(rawScale);
    const zeroPoint = Number(rawZeroPoint ?? 0);

    if (Number.isFinite(scale) && scale > 0) {
      return {
        scale,
        zeroPoint: Number.isFinite(zeroPoint) ? zeroPoint : 0,
      };
    }
  }

  return null;
}

function dequantizeIfNeeded(values: number[], tensorInfo: any): number[] {
  const quant = getQuantInfo(tensorInfo);
  const dtype = getTensorDtype(tensorInfo);

  const shouldDequantize =
    !!quant &&
    (dtype.includes('int8') ||
      dtype.includes('uint8') ||
      dtype.includes('quant') ||
      values.some((value) => Math.abs(value) > 8));

  if (!shouldDequantize || !quant) {
    return values;
  }

  return values.map((value) => (value - quant.zeroPoint) * quant.scale);
}

function quantizeInputIfNeeded(
  input: Float32Array,
  tensorInfo: any
): Float32Array | Int8Array | Uint8Array {
  const dtype = getTensorDtype(tensorInfo);
  const quant = getQuantInfo(tensorInfo);

  if (!quant) {
    return input;
  }

  if (dtype.includes('uint8')) {
    const output = new Uint8Array(input.length);

    for (let index = 0; index < input.length; index++) {
      const quantized = Math.round(input[index] / quant.scale + quant.zeroPoint);
      output[index] = Math.max(0, Math.min(255, quantized));
    }

    return output;
  }

  if (dtype.includes('int8')) {
    const output = new Int8Array(input.length);

    for (let index = 0; index < input.length; index++) {
      const quantized = Math.round(input[index] / quant.scale + quant.zeroPoint);
      output[index] = Math.max(-128, Math.min(127, quantized));
    }

    return output;
  }

  return input;
}

function summarize(values: number[]) {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      sample: [],
    };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    sample: values.slice(0, 10).map((value) => Number(value.toFixed(4))),
  };
}

export class STGCNRunner {
  private model: TensorflowModel | null = null;
  private static instance: STGCNRunner | null = null;
  private hasLoggedIoDetails = false;

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
      require('../../../../ml/models/stgcn_int8.tflite')
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

    const modelAny = this.model as any;
    const inputInfo = modelAny?.inputs?.[0];
    const outputInfos = modelAny?.outputs ?? [];

    const preparedInput = quantizeInputIfNeeded(windowTensor, inputInfo);

    if (!this.hasLoggedIoDetails) {
      this.hasLoggedIoDetails = true;

      console.log('STGCN input tensor info:', JSON.stringify(inputInfo, null, 2));
      console.log('STGCN output tensor info:', JSON.stringify(outputInfos, null, 2));
      console.log('STGCN input summary:', summarize(Array.from(windowTensor)));
      console.log(
        'STGCN prepared input constructor:',
        preparedInput.constructor?.name
      );
    }

    const rawOutputs = await this.model.run([preparedInput as any]);

    const rawNumberOutputs = rawOutputs.map(toNumberArray);

    console.log(
      'STGCN raw output debug:',
      rawNumberOutputs.map((output, index) => ({
        index,
        name: getTensorName(outputInfos[index]),
        dtype: getTensorDtype(outputInfos[index]),
        quant: getQuantInfo(outputInfos[index]),
        length: output.length,
        ...summarize(output),
      }))
    );

    const outputs = rawNumberOutputs.map((output, index) =>
      dequantizeIfNeeded(output, outputInfos[index])
    );

    console.log(
      'STGCN decoded output debug:',
      outputs.map((output, index) => ({
        index,
        name: getTensorName(outputInfos[index]),
        length: output.length,
        ...summarize(output),
      }))
    );

    const classOutputIndex = outputs.findIndex(
      (output) => output.length === CLASS_LABELS.length
    );

    const densityOutputIndex = outputs.findIndex(
      (output) => output.length !== CLASS_LABELS.length && output.length > 0
    );

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