import type { LLMRequest, LLMResponse } from '@/lib/types';

export interface LLMProvider {
  chat(request: LLMRequest, apiKey: string): Promise<LLMResponse>;
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('shelly-api-key') || '' : '';

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
