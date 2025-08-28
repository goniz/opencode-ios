export interface BuiltInCommand {
  name: string;
  description: string;
  endpoint: 'init' | 'share' | 'unshare' | 'summarize' | 'revert' | 'unrevert' | 'new';
}

export const BUILT_IN_COMMANDS: BuiltInCommand[] = [
  {
    name: 'new',
    description: 'Create a new chat session',
    endpoint: 'new',
  },
  {
    name: 'init',
    description: 'Create/update AGENTS.md for the project',
    endpoint: 'init',
  },
  {
    name: 'share',
    description: 'Share the current session (create public link)',
    endpoint: 'share',
  },
  {
    name: 'unshare',
    description: 'Unshare the current session',
    endpoint: 'unshare',
  },
  {
    name: 'summarize',
    description: 'Compact/summarize the current session',
    endpoint: 'summarize',
  },
  {
    name: 'undo',
    description: 'Undo last message and revert related file changes',
    endpoint: 'revert',
  },
  {
    name: 'redo',
    description: 'Redo previously undone message and restore file changes',
    endpoint: 'unrevert',
  },
];