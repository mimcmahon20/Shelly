import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';
import type { LLMProvider } from './provider';
import type { LLMRequest, LLMResponse } from '@/lib/types';

export class GoogleAIProvider implements LLMProvider {
  async chat(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = request.model || 'gemini-2.5-flash';

    const generationConfig: GenerationConfig = {
      ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
    };

    if (request.outputSchema) {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(request.outputSchema);
      } catch {
        throw new Error('Invalid output schema JSON');
      }

      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = schema as unknown as GenerationConfig['responseSchema'];
    }

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: request.systemPrompt,
      generationConfig,
    });

    const result = await model.generateContent(request.humanMessage);
    const response = result.response;
    const content = response.text();
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

    return { content, tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens };
  }

  async *chatStream(
    request: LLMRequest,
    apiKey: string
  ): AsyncGenerator<
    | { type: 'delta'; content: string }
    | { type: 'done'; content: string; tokensUsed: number; inputTokens: number; outputTokens: number }
  > {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = request.model || 'gemini-2.5-flash';

    const generationConfig: GenerationConfig = {
      ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
    };

    if (request.outputSchema) {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(request.outputSchema);
      } catch {
        throw new Error('Invalid output schema JSON');
      }

      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = schema as unknown as GenerationConfig['responseSchema'];
    }

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: request.systemPrompt,
      generationConfig,
    });

    const streamResult = await model.generateContentStream(request.humanMessage);

    let fullContent = '';
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        fullContent += text;
        yield { type: 'delta', content: text };
      }
    }

    const finalResponse = await streamResult.response;
    const inputTokens = finalResponse.usageMetadata?.promptTokenCount || 0;
    const outputTokens = finalResponse.usageMetadata?.candidatesTokenCount || 0;

    yield { type: 'done', content: fullContent, tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens };
  }
}
