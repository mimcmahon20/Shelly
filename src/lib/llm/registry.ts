// Server-only — instantiates provider classes
import type { LLMProvider } from './provider';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleVertexProvider } from './google-vertex';
import { GoogleAIProvider } from './google-ai';

export { PROVIDERS } from './providers';

const instances: Record<string, LLMProvider> = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAIProvider(),
  'google-vertex': new GoogleVertexProvider(),
  'google-ai': new GoogleAIProvider(),
};

export function getProvider(name?: string): LLMProvider {
  const key = name || 'anthropic';
  const provider = instances[key];
  if (!provider) throw new Error(`Unknown provider: ${key}`);
  return provider;
}
