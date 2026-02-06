import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from './provider';
import type { LLMRequest, LLMResponse, ToolCallTrace, VirtualFileSystem } from '@/lib/types';
import { executeVfsTool, VFS_TOOL_DEFINITIONS } from '@/lib/vfs';

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

  async *chatWithTools(
    request: LLMRequest,
    apiKey: string
  ): AsyncGenerator<
    | { type: 'tool_call'; trace: ToolCallTrace }
    | { type: 'delta'; content: string }
    | { type: 'done'; content: string; tokensUsed: number; toolCalls: ToolCallTrace[]; vfs: VirtualFileSystem }
  > {
    const client = new Anthropic({ apiKey });
    const maxIterations = request.maxToolIterations || 10;
    let vfs: VirtualFileSystem = request.vfs ? { ...request.vfs } : {};
    const allTraces: ToolCallTrace[] = [];
    let totalTokens = 0;
    let iteration = 0;

    const messages: Anthropic.Messages.MessageParam[] = [
      { role: 'user', content: request.humanMessage },
    ];

    while (true) {
      iteration++;
      const useTools = iteration <= maxIterations;

      const stream = client.messages.stream({
        model: request.model || 'claude-sonnet-4-5-20250929',
        max_tokens: 64000,
        system: request.systemPrompt,
        messages,
        ...(useTools
          ? {
              tools: VFS_TOOL_DEFINITIONS as Anthropic.Messages.Tool[],
              tool_choice: { type: 'auto' as const },
            }
          : {}),
      });

      // Stream text deltas to keep the connection alive
      let iterationText = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          iterationText += event.delta.text;
          yield { type: 'delta', content: event.delta.text };
        }
      }

      const response = await stream.finalMessage();
      totalTokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      const hasToolUse = response.content.some((b) => b.type === 'tool_use');

      if (!hasToolUse || response.stop_reason === 'end_turn') {
        // Use streamed text if available, otherwise extract from final message
        const textBlock = response.content.find((b) => b.type === 'text');
        const content = textBlock && 'text' in textBlock ? textBlock.text : iterationText;
        yield { type: 'done', content, tokensUsed: totalTokens, toolCalls: allTraces, vfs };
        return;
      }

      // Process tool calls
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        const result = executeVfsTool(
          block.name,
          block.input as Record<string, unknown>,
          vfs
        );
        vfs = result.vfs;

        const trace: ToolCallTrace = {
          id: block.id,
          toolName: block.name,
          input: block.input as Record<string, unknown>,
          output: result.output,
          iteration,
        };
        allTraces.push(trace);
        yield { type: 'tool_call', trace };

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result.output,
        });
      }

      // Append assistant response + tool results to conversation
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }
}
