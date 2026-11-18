/**
 * Lightweight browser runner for the exported TensorFlow.js BISINDO alphabet MLP.
 *
 * Parses `model.json`, `group1-shard1of1.bin`, and `labels.json` directly using
 * typed Float32Arrays so inference takes <0.2ms per frame without external runtime bloat.
 */

export interface TfjsWeightSpec {
  name: string;
  shape: number[];
  dtype: string;
}

interface TfjsLayerConfig {
  class_name: string;
  config: {
    name: string;
    units?: number;
    activation?: string;
    use_bias?: boolean;
    epsilon?: number;
  };
}

interface TfjsModelJson {
  modelTopology: {
    model_config: {
      config: {
        layers: TfjsLayerConfig[];
      };
    };
  };
  weightsManifest: Array<{
    paths: string[];
    weights: TfjsWeightSpec[];
  }>;
}

interface DenseLayerRuntime {
  kind: "Dense";
  inDim: number;
  outDim: number;
  activation: string;
  kernel: Float32Array;
  bias: Float32Array | null;
}

interface BatchNormLayerRuntime {
  kind: "BatchNormalization";
  epsilon: number;
  gamma: Float32Array;
  beta: Float32Array;
  mean: Float32Array;
  variance: Float32Array;
}

type RuntimeLayer = DenseLayerRuntime | BatchNormLayerRuntime;

export interface AlphabetClassifier {
  labels: string[];
  inputDim: number;
  predictProbabilities: (features: Float32Array) => Float32Array;
}

function buildWeightMap(
  buffer: ArrayBuffer,
  specs: TfjsWeightSpec[],
): Map<string, Float32Array> {
  const weights = new Map<string, Float32Array>();
  let byteOffset = 0;

  for (const spec of specs) {
    const count = spec.shape.reduce((acc, dim) => acc * dim, 1);
    const byteLength = count * Float32Array.BYTES_PER_ELEMENT;
    const view = new Float32Array(buffer.slice(byteOffset, byteOffset + byteLength));
    weights.set(spec.name, view);
    byteOffset += byteLength;
  }

  return weights;
}

function buildRuntimeLayers(
  layers: TfjsLayerConfig[],
  weightMap: Map<string, Float32Array>,
): RuntimeLayer[] {
  const runtime: RuntimeLayer[] = [];

  for (const layer of layers) {
    const name = layer.config.name;
    if (layer.class_name === "Dense") {
      const kernel = weightMap.get(`${name}/kernel`);
      if (!kernel) {
        throw new Error(`Missing kernel weights for Dense layer "${name}"`);
      }
      const outDim = layer.config.units ?? 0;
      if (outDim <= 0 || kernel.length % outDim !== 0) {
        throw new Error(`Invalid Dense weight shape for layer "${name}"`);
      }
      const bias = layer.config.use_bias ? (weightMap.get(`${name}/bias`) ?? null) : null;
      runtime.push({
        kind: "Dense",
        inDim: kernel.length / outDim,
        outDim,
        activation: layer.config.activation ?? "linear",
        kernel,
        bias,
      });
    } else if (layer.class_name === "BatchNormalization") {
      const gamma = weightMap.get(`${name}/gamma`);
      const beta = weightMap.get(`${name}/beta`);
      const mean = weightMap.get(`${name}/moving_mean`);
      const variance = weightMap.get(`${name}/moving_variance`);
      if (!gamma || !beta || !mean || !variance) {
        throw new Error(`Missing BatchNormalization weights for "${name}"`);
      }
      runtime.push({
        kind: "BatchNormalization",
        epsilon: layer.config.epsilon ?? 1e-3,
        gamma,
        beta,
        mean,
        variance,
      });
    }
  }

  return runtime;
}

function applyDense(input: Float32Array, layer: DenseLayerRuntime): Float32Array {
  const { inDim, outDim, kernel, bias, activation } = layer;
  if (input.length !== inDim) {
    throw new Error(`Expected input dim ${inDim}, got ${input.length}`);
  }

  const out = new Float32Array(outDim);
  for (let j = 0; j < outDim; j++) {
    out[j] = bias ? bias[j] : 0;
  }

  for (let i = 0; i < inDim; i++) {
    const x = input[i];
    if (x === 0) continue;
    const rowOffset = i * outDim;
    for (let j = 0; j < outDim; j++) {
      out[j] += x * kernel[rowOffset + j];
    }
  }

  if (activation === "relu") {
    for (let j = 0; j < outDim; j++) {
      if (out[j] < 0) out[j] = 0;
    }
  } else if (activation === "softmax") {
    let maxVal = -Infinity;
    for (let j = 0; j < outDim; j++) {
      if (out[j] > maxVal) maxVal = out[j];
    }
    let sumExp = 0;
    for (let j = 0; j < outDim; j++) {
      const expVal = Math.exp(out[j] - maxVal);
      out[j] = expVal;
      sumExp += expVal;
    }
    const denom = sumExp > 0 ? sumExp : 1;
    for (let j = 0; j < outDim; j++) {
      out[j] /= denom;
    }
  }

  return out;
}

function applyBatchNorm(input: Float32Array, layer: BatchNormLayerRuntime): Float32Array {
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const invStd = 1 / Math.sqrt(layer.variance[i] + layer.epsilon);
    out[i] = layer.gamma[i] * ((input[i] - layer.mean[i]) * invStd) + layer.beta[i];
  }
  return out;
}

let cachedPromise: Promise<AlphabetClassifier> | null = null;

/**
 * Load and cache the BISINDO 86-dim TF.js classifier from `/models/bisindo/`.
 */
export function loadAlphabetClassifier(basePath = "/models/bisindo"): Promise<AlphabetClassifier> {
  if (!cachedPromise || basePath !== "/models/bisindo") {
    const promise = (async (): Promise<AlphabetClassifier> => {
      const [modelRes, labelsRes] = await Promise.all([
        fetch(`${basePath}/model.json`, { cache: "no-cache" }),
        fetch(`${basePath}/labels.json`, { cache: "no-cache" }),
      ]);
      if (!modelRes.ok) {
        throw new Error(`Failed to fetch model.json (${modelRes.status})`);
      }
      if (!labelsRes.ok) {
        throw new Error(`Failed to fetch labels.json (${labelsRes.status})`);
      }

      const modelJson = (await modelRes.json()) as TfjsModelJson;
      const labels = (await labelsRes.json()) as string[];
      const manifest = modelJson.weightsManifest[0];
      if (!manifest || manifest.paths.length === 0) {
        throw new Error("Invalid TF.js weightsManifest in model.json");
      }

      const shardRes = await fetch(`${basePath}/${manifest.paths[0]}`, { cache: "no-cache" });
      if (!shardRes.ok) {
        throw new Error(`Failed to fetch weights shard (${shardRes.status})`);
      }
      const buffer = await shardRes.arrayBuffer();
      const weightMap = buildWeightMap(buffer, manifest.weights);
      const runtimeLayers = buildRuntimeLayers(
        modelJson.modelTopology.model_config.config.layers,
        weightMap,
      );

      const firstDense = runtimeLayers.find((l): l is DenseLayerRuntime => l.kind === "Dense");
      const inputDim = firstDense ? firstDense.inDim : 86;

      return {
        labels,
        inputDim,
        predictProbabilities(features: Float32Array): Float32Array {
          let x = features;
          for (const layer of runtimeLayers) {
            x = layer.kind === "Dense" ? applyDense(x, layer) : applyBatchNorm(x, layer);
          }
          return x;
        },
      };
    })();

    if (basePath === "/models/bisindo") {
      cachedPromise = promise.catch((err) => {
        cachedPromise = null;
        throw err;
      });
    }
    return promise;
  }

  return cachedPromise;
}
