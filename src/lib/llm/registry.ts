import type { LLMProvider } from './provider';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleVertexProvider } from './google-vertex';

export const PROVIDERS: Record<string, { label: string; models: string[] }> = {
  anthropic: {
    label: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
  },
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini'],
  },
  'google-vertex': {
    label: 'Google Vertex',
    models: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  },
};

const instances: Record<string, LLMProvider> = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAIProvider(),
  'google-vertex': new GoogleVertexProvider(),
};

export function getProvider(name?: string): LLMProvider {
  const key = name || 'anthropic';
  const provider = instances[key];
  if (!provider) throw new Error(`Unknown provider: ${key}`);
  return provider;
}
