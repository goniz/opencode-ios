import type { Part } from '../api/types.gen';

export interface IconInfo {
  name: string;
  color: string;
  backgroundColor?: string;
}

/**
 * Maps part types and tool names to their corresponding icons and colors
 */
export function getPartIcon(part: Part): IconInfo {
  switch (part.type) {
    case 'text':
      return {
        name: 'chatbubble',
        color: '#64748b',
      };

    case 'reasoning':
      return {
        name: 'bulb',
        color: '#f59e0b',
      };

    case 'tool':
      return getToolIcon(part.tool);

    case 'file':
      return {
        name: 'document',
        color: '#8b5cf6',
      };

    case 'step-start':
      return {
        name: 'play',
        color: '#10b981',
      };

    case 'agent':
      return {
        name: 'construct',
        color: '#3b82f6',
      };

    default:
      return {
        name: 'ellipse',
        color: '#64748b',
      };
  }
}

/**
 * Maps tool names to their specific icons
 */
function getToolIcon(toolName: string): IconInfo {
  switch (toolName) {
    case 'bash':
      return {
        name: 'terminal',
        color: '#0f172a',
        backgroundColor: '#f1f5f9',
      };

    case 'edit':
      return {
        name: 'create',
        color: '#059669',
      };

    case 'write':
      return {
        name: 'document-text',
        color: '#7c3aed',
      };

    case 'read':
      return {
        name: 'eye',
        color: '#2563eb',
      };

    case 'grep':
    case 'search':
      return {
        name: 'search',
        color: '#dc2626',
      };

    case 'glob':
      return {
        name: 'folder-open',
        color: '#ea580c',
      };

    case 'list':
      return {
        name: 'list',
        color: '#0891b2',
      };

    case 'task':
      return {
        name: 'construct',
        color: '#7c2d12',
      };

    case 'webfetch':
      return {
        name: 'globe',
        color: '#1d4ed8',
      };

    case 'todowrite':
    case 'todoread':
      return {
        name: 'list-circle',
        color: '#166534',
      };

    case 'thinking-mcp_sequentialthinking':
      return {
        name: 'bulb',
        color: '#f59e0b',
      };

    case 'memory-mcp_create_entities':
    case 'memory-mcp_create_relations':
    case 'memory-mcp_add_observations':
    case 'memory-mcp_delete_entities':
    case 'memory-mcp_delete_observations':
    case 'memory-mcp_delete_relations':
    case 'memory-mcp_read_graph':
    case 'memory-mcp_search_nodes':
    case 'memory-mcp_open_nodes':
      return {
        name: 'library',
        color: '#7c3aed',
      };

    default:
      return {
        name: 'build',
        color: '#64748b',
      };
  }
}

/**
 * Gets the role icon for user/assistant messages
 */
export function getRoleIcon(role: string): IconInfo {
  switch (role) {
    case 'user':
      return {
        name: 'person',
        color: '#1f2937',
        backgroundColor: '#f3f4f6',
      };

    case 'assistant':
      return {
        name: 'sparkles',
        color: '#7c3aed',
      };

    default:
      return {
        name: 'help',
        color: '#64748b',
      };
  }
}