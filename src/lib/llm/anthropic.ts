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
        model: request.model || 'claude-sonnet-4-5-20250929',
        max_tokens: 64000,
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
      model: request.model || 'claude-sonnet-4-5-20250929',
      max_tokens: 64000,
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

  async *chatStream(
    request: LLMRequest,
    apiKey: string
  ): AsyncGenerator<{ type: 'delta'; content: string } | { type: 'done'; content: string; tokensUsed: number }> {
    const client = new Anthropic({ apiKey });

    if (request.outputSchema) {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(request.outputSchema);
      } catch {
        throw new Error('Invalid output schema JSON');
      }

      const stream = client.messages.stream({
        model: request.model || 'claude-sonnet-4-5-20250929',
        max_tokens: 64000,
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

      let jsonContent = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
          jsonContent += event.delta.partial_json;
          yield { type: 'delta', content: event.delta.partial_json };
        }
      }

      const finalMessage = await stream.finalMessage();
      const tokensUsed = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0);

      // Re-extract from final message for accuracy
      const toolBlock = finalMessage.content.find((b) => b.type === 'tool_use');
      const output = toolBlock && 'input' in toolBlock ? JSON.stringify(toolBlock.input) : jsonContent;

      yield { type: 'done', content: output, tokensUsed };
      return;
    }

    const stream = client.messages.stream({
      model: request.model || 'claude-sonnet-4-5-20250929',
      max_tokens: 64000,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.humanMessage }],
    });

    let fullContent = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullContent += event.delta.text;
        yield { type: 'delta', content: event.delta.text };
      }
    }

    const finalMessage = await stream.finalMessage();
    const tokensUsed = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0);

    yield { type: 'done', content: fullContent, tokensUsed };
  }
}
