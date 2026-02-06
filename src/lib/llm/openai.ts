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
}
