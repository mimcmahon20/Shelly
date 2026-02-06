import type { LLMRequest, LLMResponse, ToolCallTrace, VirtualFileSystem } from '@/lib/types';

export interface LLMProvider {
  chat(request: LLMRequest, apiKey: string): Promise<LLMResponse>;
}

const API_KEY_MAP: Record<string, string> = {
  anthropic: 'shelly-api-key-anthropic',
  openai: 'shelly-api-key-openai',
  'google-vertex': 'shelly-api-key-google-vertex',
};

export async function callLLMStream(request: LLMRequest, onDelta?: (text: string) => void): Promise<LLMResponse> {
  const provider = request.provider || 'anthropic';
  const storageKey = API_KEY_MAP[provider] || 'shelly-api-key-anthropic';
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(storageKey) || '' : '';

  const res = await fetch('/api/llm/chat?stream=true', {
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

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let finalContent = '';
  let finalTokensUsed = 0;
  let finalInputTokens = 0;
  let finalOutputTokens = 0;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json) continue;

      const event = JSON.parse(json);
      if (event.type === 'error') throw new Error(event.error);
      if (event.type === 'delta' && onDelta) {
        onDelta(event.content);
      }
      if (event.type === 'done') {
        finalContent = event.content;
        finalTokensUsed = event.tokensUsed;
        finalInputTokens = event.inputTokens || 0;
        finalOutputTokens = event.outputTokens || 0;
      }
    }
  }

  return { content: finalContent, tokensUsed: finalTokensUsed, inputTokens: finalInputTokens, outputTokens: finalOutputTokens };
}

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

export async function callLLMWithTools(
  request: LLMRequest & { vfs: VirtualFileSystem; maxToolIterations?: number },
  onToolCall?: (trace: ToolCallTrace) => void,
  onDelta?: (text: string) => void
): Promise<LLMResponse> {
  const provider = request.provider || 'anthropic';
  const storageKey = API_KEY_MAP[provider] || 'shelly-api-key-anthropic';
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(storageKey) || '' : '';

  const res = await fetch('/api/llm/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      ...request,
      toolsEnabled: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM call failed: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let finalContent = '';
  let finalTokensUsed = 0;
  let finalInputTokens = 0;
  let finalOutputTokens = 0;
  let finalToolCalls: ToolCallTrace[] = [];
  let finalVfs: VirtualFileSystem = {};
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json) continue;

      const event = JSON.parse(json);
      if (event.type === 'error') throw new Error(event.error);
      if (event.type === 'delta' && onDelta) {
        onDelta(event.content);
      }
      if (event.type === 'tool_call' && onToolCall) {
        onToolCall(event.trace);
      }
      if (event.type === 'done') {
        finalContent = event.content;
        finalTokensUsed = event.tokensUsed;
        finalInputTokens = event.inputTokens || 0;
        finalOutputTokens = event.outputTokens || 0;
        finalToolCalls = event.toolCalls || [];
        finalVfs = event.vfs || {};
      }
    }
  }

  return {
    content: finalContent,
    tokensUsed: finalTokensUsed,
    inputTokens: finalInputTokens,
    outputTokens: finalOutputTokens,
    toolCalls: finalToolCalls,
    vfs: finalVfs,
  };
}
