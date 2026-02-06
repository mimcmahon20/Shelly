import type { Flow, VirtualFileSystem } from './types';

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

const SEED_VFS: VirtualFileSystem = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app"></div>
  <script src="script.js"></script>
</body>
</html>`,
  'style.css': `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 960px; margin: 0 auto; padding: 1rem; }`,
  'script.js': `document.addEventListener('DOMContentLoaded', () => {
  // App logic here
});`,
};

export const EXAMPLE_VFS_FLOW: Flow = {
  id: 'example-edu-game-builder',
  name: 'Educational Game Builder',
  nodes: [
    {
      id: 'user-input-1',
      type: 'user-input',
      position: { x: 250, y: 0 },
      data: { label: 'Grade & Topic' },
    },
    {
      id: 'classifier-1',
      type: 'structured-output',
      position: { x: 250, y: 150 },
      data: {
        label: 'Classifier',
        provider: 'anthropic',
        model: 'claude-opus-4-6',
        systemPrompt:
          "Classify the user's educational game request. If they want a new game built (keywords: 'build', 'create', 'make', 'design a game about'), classify as 'generate'. If they want changes to an existing game (keywords: 'change', 'update', 'fix', 'add', 'make it', 'make the'), classify as 'edit'.",
        humanMessageTemplate: '{{input}}',
        outputSchema:
          '{"type":"object","properties":{"action":{"type":"string","description":"\'generate\' for new game or \'edit\' for modifying existing"}},"required":["action"]}',
      },
    },
    {
      id: 'router-1',
      type: 'router',
      position: { x: 250, y: 300 },
      data: {
        label: 'Route Action',
        routingRules: [
          {
            field: 'action',
            operator: 'equals',
            value: 'generate',
            targetNodeId: 'agent-planner',
          },
        ],
        defaultTargetNodeId: 'agent-editor',
      },
    },
    {
      id: 'agent-planner',
      type: 'agent',
      position: { x: 75, y: 475 },
      data: {
        label: 'Game Planner',
        provider: 'anthropic',
        model: 'claude-haiku-4-5-20251001',
        systemPrompt:
          'You are a game visual designer for educational games. Given a grade level and topic, produce a concise design brief. Include: 1) Color palette — 3-4 specific hex colors. Use bold, flat, saturated colors. NO gradients. NO pastels. 2) Typography — font style and size hierarchy 3) Layout — how the game screen is organized (header, game area, score display, controls) 4) Visual theme fitting the grade level. Keep the brief short and actionable. Do NOT use emojis anywhere.',
        humanMessageTemplate: 'Design an educational game for: {{user-input-1}}',
      },
    },
    {
      id: 'agent-generator',
      type: 'agent',
      position: { x: 75, y: 650 },
      data: {
        label: 'Game Generator',
        provider: 'anthropic',
        model: 'claude-opus-4-6',
        toolsEnabled: true,
        maxToolIterations: 15,
        systemPrompt:
          'You are an expert game developer who builds interactive educational games using a virtual filesystem.\n\nWorkflow:\n1. Call list_files to see existing files\n2. Call view on each file\n3. Use edit and create_file to build the game\n\nGame requirements (non-negotiable):\n- Start screen with game title, brief instructions, and a Start button\n- End screen showing final score and a Play Again button\n- Scoring system visible during gameplay\n- Time-based element (countdown timer, timed rounds, or speed bonus)\n- Educational content appropriate for the specified grade level\n- At least 8-10 questions/challenges per game session\n\nDesign rules:\n- NO emojis anywhere in the game\n- NO CSS gradients — use flat, solid background colors\n- Bold, clean typography with clear visual hierarchy\n- Follow the design brief\'s color palette exactly\n\nTechnical rules:\n- Split code across index.html, style.css, script.js\n- HTML references style.css via <link> and script.js via <script>\n- Vanilla JavaScript only, no external dependencies\n- Mobile-responsive layout',
        humanMessageTemplate:
          'Build an educational game for: {{user-input-1}}\n\nFollow this design brief:\n{{agent-planner}}',
      },
    },
    {
      id: 'agent-editor',
      type: 'agent',
      position: { x: 425, y: 475 },
      data: {
        label: 'Game Editor',
        provider: 'anthropic',
        model: 'claude-opus-4-6',
        toolsEnabled: true,
        maxToolIterations: 10,
        systemPrompt:
          'You are a senior game developer who edits educational games in a virtual filesystem.\n\nWorkflow:\n1. Call list_files, then view each file to understand the current game\n2. Make targeted edits based on the user\'s request\n\nCore requirements you must preserve:\n- Start screen with title, instructions, Start button\n- End screen with score and Play Again button\n- Scoring system visible during gameplay\n- Time-based element\n- No emojis, no gradients\n\nRules:\n- Make surgical edits only — do NOT rewrite files from scratch\n- Keep the existing game structure and design intent\n- Only change what the user specifically asked for\n- Maintain all core game requirements above',
        humanMessageTemplate:
          'The user wants to change the game: {{user-input-1}}\n\nReview the game files and make the requested changes.',
      },
    },
    {
      id: 'html-preview-1',
      type: 'html-renderer',
      position: { x: 250, y: 825 },
      data: { label: 'Game Preview' },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 250, y: 1000 },
      data: { label: 'Output' },
    },
  ],
  edges: [
    // Flow control: user-input → classifier (MUST be first edge from user-input-1)
    { id: 'e-input-classifier', source: 'user-input-1', target: 'classifier-1' },
    { id: 'e-classifier-router', source: 'classifier-1', target: 'router-1' },
    // Router targets
    { id: 'e-router-planner', source: 'router-1', target: 'agent-planner' },
    { id: 'e-router-editor', source: 'router-1', target: 'agent-editor' },
    // Data edges: user input forwarded to agents
    { id: 'e-input-planner', source: 'user-input-1', target: 'agent-planner' },
    { id: 'e-planner-generator', source: 'agent-planner', target: 'agent-generator' },
    { id: 'e-input-generator', source: 'user-input-1', target: 'agent-generator' },
    { id: 'e-input-editor', source: 'user-input-1', target: 'agent-editor' },
    // Both paths converge on preview → output
    { id: 'e-generator-preview', source: 'agent-generator', target: 'html-preview-1' },
    { id: 'e-editor-preview', source: 'agent-editor', target: 'html-preview-1' },
    { id: 'e-preview-output', source: 'html-preview-1', target: 'output-1' },
  ],
  initialVfs: SEED_VFS,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
