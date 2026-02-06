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
    };

    const response = await generativeModel.generateContent(req);
    const result = response.response;
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const inputTokens = result.usageMetadata?.promptTokenCount || 0;
    const outputTokens = result.usageMetadata?.candidatesTokenCount || 0;

    return { content, tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens };
  }
}
