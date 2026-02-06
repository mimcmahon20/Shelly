import type { VirtualFileSystem } from './types';

export function executeVfsTool(
  toolName: string,
  input: Record<string, unknown>,
  vfs: VirtualFileSystem
): { output: string; vfs: VirtualFileSystem } {
  const next = { ...vfs };

  switch (toolName) {
    case 'view': {
      const path = input.path as string;
      if (!(path in next)) {
        return { output: `Error: file not found: ${path}`, vfs: next };
      }
      const content = next[path];
      const lines = content.split('\n');
      const lineRange = input.line_range as [number, number] | undefined;
      if (lineRange) {
        const [start, end] = lineRange;
        const slice = lines.slice(Math.max(0, start - 1), end);
        const numbered = slice.map((l, i) => `${start + i}: ${l}`).join('\n');
        return { output: numbered, vfs: next };
      }
      const numbered = lines.map((l, i) => `${i + 1}: ${l}`).join('\n');
      return { output: numbered, vfs: next };
    }

    case 'edit': {
      const path = input.path as string;
      if (!(path in next)) {
        return { output: `Error: file not found: ${path}`, vfs: next };
      }
      const oldText = input.old_text as string;
      const newText = input.new_text as string;
      if (!next[path].includes(oldText)) {
        return { output: `Error: old_text not found in ${path}`, vfs: next };
      }
      next[path] = next[path].replace(oldText, newText);
      return { output: `Successfully edited ${path}`, vfs: next };
    }

    case 'create_file': {
      const path = input.path as string;
      const content = input.content as string;
      next[path] = content;
      return { output: `Successfully created ${path}`, vfs: next };
    }

    case 'list_files': {
      const paths = Object.keys(next).sort();
      if (paths.length === 0) {
        return { output: '(no files)', vfs: next };
      }
      return { output: paths.join('\n'), vfs: next };
    }

    default:
      return { output: `Error: unknown tool: ${toolName}`, vfs: next };
  }
}

export const VFS_TOOL_DEFINITIONS = [
  {
    name: 'view',
    description: 'View the contents of a file with line numbers. Optionally specify a line range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'The file path to view' },
        line_range: {
          type: 'array',
          items: { type: 'number' },
          minItems: 2,
          maxItems: 2,
          description: 'Optional [start, end] line range (1-indexed, inclusive)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'edit',
    description: 'Edit a file by replacing the first occurrence of old_text with new_text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'The file path to edit' },
        old_text: { type: 'string', description: 'The text to find and replace' },
        new_text: { type: 'string', description: 'The replacement text' },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file or overwrite an existing file with the given content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'The file path to create' },
        content: { type: 'string', description: 'The file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files in the virtual filesystem.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];
