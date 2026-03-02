import OpenAI from 'openai';
import type { LLMProvider } from './provider';
import type { LLMRequest, LLMResponse } from '@/lib/types';

export class OpenAIProvider implements LLMProvider {
  async chat(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const client = new OpenAI({ apiKey });
    const model = request.model || 'gpt-4o';

    if (request.outputSchema) {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(request.outputSchema);
      } catch {
        throw new Error('Invalid output schema JSON');
      }

      const response = await client.chat.completions.create({
        model,
        max_tokens: request.maxTokens || undefined,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.humanMessage },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'structured_output',
              description: 'Return the structured output matching the schema',
              parameters: schema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'structured_output' } },
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      const content = toolCall && 'function' in toolCall ? toolCall.function.arguments : '';

      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;

      return {
        content,
        tokensUsed: response.usage?.total_tokens || 0,
        inputTokens,
        outputTokens,
      };
    }

    const response = await client.chat.completions.create({
      model,
      max_tokens: request.maxTokens || undefined,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.humanMessage },
      ],
    });

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
      content: response.choices[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      inputTokens,
      outputTokens,
    };
  }

  async *chatStream(
    request: LLMRequest,
    apiKey: string
  ): AsyncGenerator<
    | { type: 'delta'; content: string }
    | { type: 'done'; content: string; tokensUsed: number; inputTokens: number; outputTokens: number }
  > {
    // For structured output, fall back to non-streaming
    if (request.outputSchema) {
      const result = await this.chat(request, apiKey);
      yield { type: 'delta', content: result.content };
      yield { type: 'done', content: result.content, tokensUsed: result.tokensUsed, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
      return;
    }

    const client = new OpenAI({ apiKey });
    const model = request.model || 'gpt-4o';

    const stream = await client.chat.completions.create({
      model,
      max_tokens: request.maxTokens || undefined,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.humanMessage },
      ],
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullContent += text;
        yield { type: 'delta', content: text };
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens || 0;
        outputTokens = chunk.usage.completion_tokens || 0;
      }
    }

    yield { type: 'done', content: fullContent, tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens };
  }
}
