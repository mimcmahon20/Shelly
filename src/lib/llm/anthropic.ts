import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from './provider';
import type { LLMRequest, LLMResponse } from '@/lib/types';

export class AnthropicProvider implements LLMProvider {
  async chat(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const client = new Anthropic({ apiKey });

    if (request.outputSchema) {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(request.outputSchema);
      } catch {
        throw new Error('Invalid output schema JSON');
      }

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: request.systemPrompt,
        tools: [
          {
            name: 'structured_output',
            description: 'Return the structured output matching the schema',
            input_schema: schema as Anthropic.Messages.Tool['input_schema'],
          },
        ],
        tool_choice: { type: 'tool', name: 'structured_output' },
        messages: [{ role: 'user', content: request.humanMessage }],
      });

      const toolBlock = response.content.find((b) => b.type === 'tool_use');
      const output = toolBlock && 'input' in toolBlock ? JSON.stringify(toolBlock.input) : '';

      return {
        content: output,
        tokensUsed: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      };
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.humanMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const content = textBlock && 'text' in textBlock ? textBlock.text : '';

    return {
      content,
      tokensUsed: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    };
  }
}
