import type { Flow } from './types';

export const EXAMPLE_FLOW: Flow = {
  id: 'example-designer-builder',
  name: 'Designer + Builder',
  nodes: [
    {
      id: 'user-input-1',
      type: 'user-input',
      position: { x: 250, y: 50 },
      data: { label: 'Game Topic Input' },
    },
    {
      id: 'agent-designer',
      type: 'agent',
      position: { x: 250, y: 200 },
      data: {
        label: 'Game Designer',
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
        systemPrompt:
          'You are an expert educational game designer. Given a topic, you design a detailed concept for a single-page interactive browser game that teaches the topic effectively. Your design should include:\n\n1. Game title\n2. Learning objectives (2-3 bullet points)\n3. Game mechanics — how the player interacts and learns\n4. Visual layout description — what the page looks like, where elements are placed\n5. Scoring/feedback system — how the player knows they\'re learning\n6. Content details — the specific questions, facts, or challenges to include (at least 8-10 items)\n\nKeep the scope realistic for a single HTML file with embedded CSS and JS. Favor simple but engaging mechanics: quizzes, drag-and-drop matching, flashcard flip, timed challenges, sorting, etc.',
        humanMessageTemplate: 'Design an interactive educational game about: {{input}}',
      },
    },
    {
      id: 'structured-builder',
      type: 'structured-output',
      position: { x: 250, y: 450 },
      data: {
        label: 'Game Builder',
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
        systemPrompt:
          'You are an expert front-end developer who builds interactive educational games as single HTML files. You receive a game design document and produce a complete, self-contained HTML file with embedded CSS and JavaScript.\n\nRequirements:\n- The entire game must be in one HTML file (inline styles and scripts)\n- Use modern CSS (flexbox/grid, animations, transitions) for a polished look\n- Make it mobile-responsive\n- Include a start screen, the game itself, and a results/score screen\n- Use clean, readable fonts and a visually appealing color scheme\n- All interactivity must work without any external dependencies\n- Include sound feedback using the Web Audio API (short beeps for correct/incorrect)\n- Add a progress indicator so the player knows how far along they are',
        humanMessageTemplate:
          'Build the complete HTML game based on this design:\n\n{{input}}',
        outputSchema:
          '{"type":"object","properties":{"html":{"type":"string","description":"The complete HTML document including DOCTYPE, head, inline CSS, body, and inline JavaScript. This should be a fully self-contained single-file game."}},"required":["html"]}',
      },
    },
    {
      id: 'html-preview',
      type: 'html-renderer',
      position: { x: 250, y: 700 },
      data: { label: 'Game Preview' },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 250, y: 900 },
      data: { label: 'Game Output' },
    },
  ],
  edges: [
    { id: 'e-input-designer', source: 'user-input-1', target: 'agent-designer' },
    { id: 'e-designer-builder', source: 'agent-designer', target: 'structured-builder' },
    { id: 'e-builder-preview', source: 'structured-builder', target: 'html-preview' },
    { id: 'e-preview-output', source: 'html-preview', target: 'output-1' },
  ],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
