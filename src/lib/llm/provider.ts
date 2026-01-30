import type { LLMRequest, LLMResponse } from '@/lib/types';

export interface LLMProvider {
  chat(request: LLMRequest, apiKey: string): Promise<LLMResponse>;
}

const API_KEY_MAP: Record<string, string> = {
  anthropic: 'shelly-api-key-anthropic',
  openai: 'shelly-api-key-openai',
  'google-vertex': 'shelly-api-key-google-vertex',
};

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const provider = request.provider || 'anthropic';
  const storageKey = API_KEY_MAP[provider] || 'shelly-api-key-anthropic';
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(storageKey) || '' : '';

  const res = await fetch('/api/llm/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM call failed: ${text}`);
  }

  return res.json();
}
