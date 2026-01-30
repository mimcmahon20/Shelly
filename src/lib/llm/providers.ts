// Provider metadata — safe to import on client and server
export const PROVIDERS: Record<string, { label: string; models: string[] }> = {
  anthropic: {
    label: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
  },
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini'],
  },
  'google-vertex': {
    label: 'Google Vertex',
    models: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  },
};
