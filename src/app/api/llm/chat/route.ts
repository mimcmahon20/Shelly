import { NextRequest, NextResponse } from 'next/server';
import { AnthropicProvider } from '@/lib/llm/anthropic';
import type { LLMRequest } from '@/lib/types';

const provider = new AnthropicProvider();

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const body = (await req.json()) as LLMRequest;

  if (!body.systemPrompt || !body.humanMessage) {
    return NextResponse.json({ error: 'systemPrompt and humanMessage required' }, { status: 400 });
  }

  try {
    const result = await provider.chat(body, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
