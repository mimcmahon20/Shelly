import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm/registry';
import { AnthropicProvider } from '@/lib/llm/anthropic';
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

  const streamRequested = req.nextUrl.searchParams.get('stream') === 'true';

  try {
    const provider = getProvider(body.provider);

    if (body.toolsEnabled && provider instanceof AnthropicProvider) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of provider.chatWithTools(body, apiKey)) {
              const data = JSON.stringify(event);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (streamRequested && provider instanceof AnthropicProvider) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of provider.chatStream(body, apiKey)) {
              const data = JSON.stringify(event);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const result = await provider.chat(body, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
