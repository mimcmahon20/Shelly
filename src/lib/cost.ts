// Pricing per million tokens: [input, output]
const MODEL_PRICING: Record<string, [number, number]> = {
  // Claude 4.x
  'claude-opus-4-6': [5, 25],
  'claude-opus-4-5-20250929': [5, 25],
  'claude-opus-4-1-20250414': [15, 75],
  'claude-opus-4-20250514': [15, 75],
  'claude-sonnet-4-5-20250929': [3, 15],
  'claude-sonnet-4-20250514': [3, 15],
  'claude-haiku-4-5-20251001': [1, 5],
  // Claude 3.x
  'claude-3-5-sonnet-20241022': [3, 15],
  'claude-3-5-sonnet-20240620': [3, 15],
  'claude-3-5-haiku-20241022': [0.8, 4],
  'claude-3-haiku-20240307': [0.25, 1.25],
  'claude-3-opus-20240229': [15, 75],
  'claude-3-sonnet-20240229': [3, 15],
};

// Default pricing (Sonnet 4.5 tier) for unknown models
const DEFAULT_PRICING: [number, number] = [3, 15];

export function getModelPricing(model?: string): [number, number] {
  if (!model) return DEFAULT_PRICING;
  return MODEL_PRICING[model] ?? DEFAULT_PRICING;
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model?: string
): number {
  const [inputRate, outputRate] = getModelPricing(model);
  return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return '<$0.001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}
