import { VertexAI, type GenerateContentRequest } from '@google-cloud/vertexai';
import type { LLMProvider } from './provider';
import type { LLMRequest, LLMResponse } from '@/lib/types';

export class GoogleVertexProvider implements LLMProvider {
  async chat(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    // apiKey is formatted as "projectId:location" for Vertex AI
    const [project, location] = apiKey.split(':');
    if (!project || !location) {
      throw new Error('Google Vertex API key must be formatted as "projectId:location"');
    }

    const vertexAI = new VertexAI({ project, location });
    const model = request.model || 'gemini-2.0-flash';
    const generativeModel = vertexAI.getGenerativeModel({ model });

    if (request.outputSchema) {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(request.outputSchema);
      } catch {
        throw new Error('Invalid output schema JSON');
      }

      const req: GenerateContentRequest = {
        contents: [{ role: 'user', parts: [{ text: request.humanMessage }] }],
        systemInstruction: { role: 'system', parts: [{ text: request.systemPrompt }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
        },
      };

      const response = await generativeModel.generateContent(req);
      const result = response.response;
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const inputTokens = result.usageMetadata?.promptTokenCount || 0;
      const outputTokens = result.usageMetadata?.candidatesTokenCount || 0;

      return { content, tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens };
    }

    const req: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: request.humanMessage }] }],
      systemInstruction: { role: 'system', parts: [{ text: request.systemPrompt }] },
      ...(request.maxTokens ? { generationConfig: { maxOutputTokens: request.maxTokens } } : {}),
    };

    const response = await generativeModel.generateContent(req);
    const result = response.response;
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const inputTokens = result.usageMetadata?.promptTokenCount || 0;
    const outputTokens = result.usageMetadata?.candidatesTokenCount || 0;

    return { content, tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens };
  }

  async *chatStream(
    request: LLMRequest,
    apiKey: string
  ): AsyncGenerator<
    | { type: 'delta'; content: string }
    | { type: 'done'; content: string; tokensUsed: number; inputTokens: number; outputTokens: number }
  > {
    const [project, location] = apiKey.split(':');
    if (!project || !location) {
      throw new Error('Google Vertex API key must be formatted as "projectId:location"');
    }

    const vertexAI = new VertexAI({ project, location });
    const model = request.model || 'gemini-2.0-flash';
    const generativeModel = vertexAI.getGenerativeModel({ model });

    if (request.outputSchema) {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(request.outputSchema);
      } catch {
        throw new Error('Invalid output schema JSON');
      }

      const req: GenerateContentRequest = {
        contents: [{ role: 'user', parts: [{ text: request.humanMessage }] }],
        systemInstruction: { role: 'system', parts: [{ text: request.systemPrompt }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
        },
      };

      const streamResult = await generativeModel.generateContentStream(req);
      let fullContent = '';

      for await (const chunk of streamResult.stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          fullContent += text;
          yield { type: 'delta', content: text };
        }
      }

      const finalResponse = await streamResult.response;
      const inputTokens = finalResponse.usageMetadata?.promptTokenCount || 0;
      const outputTokens = finalResponse.usageMetadata?.candidatesTokenCount || 0;

      yield { type: 'done', content: fullContent, tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens };
      return;
    }

    const req: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: request.humanMessage }] }],
      systemInstruction: { role: 'system', parts: [{ text: request.systemPrompt }] },
      ...(request.maxTokens ? { generationConfig: { maxOutputTokens: request.maxTokens } } : {}),
    };

    const streamResult = await generativeModel.generateContentStream(req);
    let fullContent = '';

    for await (const chunk of streamResult.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
