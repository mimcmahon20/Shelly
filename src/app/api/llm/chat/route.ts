import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm/registry';
import type { LLMRequest } from '@/lib/types';

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
    const provider = getProvider(body.provider);
    const result = await provider.chat(body, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
