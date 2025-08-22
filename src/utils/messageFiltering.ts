import type { Part } from '../api/types.gen';

/**
 * Filters message parts based on web implementation logic
 * - Filter out duplicate step-start parts (only show first)
 * - Hide internal system parts (snapshot, patch, step-finish)
 * - Hide synthetic text parts (system-generated)
 * - Hide todoread tool calls
 * - Hide empty text parts
 * - Hide pending/running tool calls
 */
export function filterMessageParts(parts: Part[]): Part[] {
  const filtered: Part[] = [];
  let hasStepStart = false;

  for (const part of parts) {
    // Filter out duplicate step-start parts (only show first)
    if (part.type === 'step-start') {
      if (hasStepStart) {
        continue;
      }
      hasStepStart = true;
    }

    // Hide internal system parts
    if (part.type === 'snapshot' || part.type === 'patch' || part.type === 'step-finish') {
      continue;
    }

    // Hide synthetic text parts (system-generated)
    if (part.type === 'text' && part.synthetic) {
      continue;
    }

    // Hide empty text parts
    if (part.type === 'text' && (!part.text || part.text.trim() === '')) {
      continue;
    }

    // Hide todoread tool calls
    if (part.type === 'tool' && part.tool === 'todoread') {
      continue;
    }

    // Note: Show all tool calls including pending/running states so users can see what AI is doing

    // Part passed all filters, include it
    filtered.push(part);
  }

  return filtered;
}

/**
 * Checks if a part should be visible based on its type and state
 */
export function isPartVisible(part: Part): boolean {
  switch (part.type) {
    case 'text':
      // Hide synthetic text parts or empty text
      return !part.synthetic && Boolean(part.text && part.text.trim() !== '');
    
    case 'reasoning':
      // Always show reasoning parts
      return true;
    
    case 'file':
      // Always show file parts
      return true;
    
    case 'tool':
      // Hide todoread tool calls but show all other tool calls including pending/running states
      if (part.tool === 'todoread') return false;
      return true;
    
    case 'step-start':
      // Only show first step-start
      return true; // Handled by filterMessageParts logic
    
    case 'step-finish':
    case 'snapshot':
    case 'patch':
      // Hide internal system parts
      return false;
    
    case 'agent':
      // Show agent parts
      return true;
    
    default:
      // Show unknown parts by default
      return true;
  }
}

/**
 * Groups parts by their visibility and importance for rendering
 */
export function categorizeMessageParts(parts: Part[]) {
  const visible = filterMessageParts(parts);
  const hidden = parts.filter(part => !visible.includes(part));
  
  return {
    visible,
    hidden,
    total: parts.length,
    hasContent: visible.length > 0
  };
}