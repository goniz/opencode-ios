import type { Command } from '../api/types.gen';

export interface CommandMention {
  name: string;
  start: number;
  end: number;
  query: string;
}

export interface CommandSuggestion {
  name: string;
  description?: string;
  agent?: string;
  model?: string;
  template: string;
}

/**
 * Detects command mentions in text using the / syntax
 * @param text The text to search for command mentions
 * @returns Array of command mentions found in the text
 */
export function detectCommandMentions(text: string): CommandMention[] {
  const mentions: CommandMention[] = [];
  const regex = /\/([^\s\/]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      name: match[1],
      start: match.index,
      end: match.index + match[0].length,
      query: match[1]
    });
  }

  return mentions;
}



/**
 * Searches for commands based on a query
 * @param query The search query
 * @param commands The available commands
 * @returns Array of matching command suggestions
 */
export function searchCommands(query: string, commands: Command[]): CommandSuggestion[] {
  if (!query || query.length < 1) {
    return commands.slice(0, 10).map(command => ({
      name: command.name,
      description: command.description,
      agent: command.agent,
      model: command.model,
      template: command.template
    })); // Show first 10 commands if no query
  }

  const lowerQuery = query.toLowerCase();
  
  return commands
    .filter(command => 
      command.name.toLowerCase().includes(lowerQuery) ||
      (command.description && command.description.toLowerCase().includes(lowerQuery))
    )
    .map(command => ({
      name: command.name,
      description: command.description,
      agent: command.agent,
      model: command.model,
      template: command.template
    }));
}

/**
 * Gets the current command mention being typed based on cursor position
 * @param text The full text
 * @param cursorPosition The current cursor position
 * @returns The current command mention or null if none found
 */
export function getCurrentCommandMention(text: string, cursorPosition: number): { start: number; end: number; query: string } | null {
  // Look for / symbol before cursor position
  let start = cursorPosition - 1;
  
  // Find the start of the mention (/ symbol)
  while (start >= 0 && text[start] !== '/') {
    if (text[start] === ' ' || text[start] === '\n') {
      return null; // Hit whitespace before finding /
    }
    start--;
  }
  
  if (start < 0 || text[start] !== '/') {
    return null; // No / found
  }
  
  // Check if this is at the start of text or after whitespace (to avoid matching URLs)
  if (start > 0 && text[start - 1] !== ' ' && text[start - 1] !== '\n') {
    return null; // Not a valid command mention (likely part of URL or path)
  }
  
  // Find the end of the mention (whitespace or end of string)
  let end = start + 1;
  while (end < text.length && text[end] !== ' ' && text[end] !== '\n' && text[end] !== '/') {
    end++;
  }
  
  // If cursor is not within the mention, return null
  if (cursorPosition < start || cursorPosition > end) {
    return null;
  }
  
  const query = text.slice(start + 1, cursorPosition); // Only up to cursor position
  return { start, end, query };
}

/**
 * Replaces a command mention in text with the selected command name
 * @param text The original text
 * @param mention The mention to replace
 * @param selectedCommand The selected command name
 * @returns The updated text with the mention replaced
 */
export function replaceCommandMention(text: string, mention: { start: number; end: number }, selectedCommand: string): string {
  return text.slice(0, mention.start) + `/${selectedCommand}` + text.slice(mention.end);
}

/**
 * Formats command suggestions for display
 * @param suggestions Array of command suggestions
 * @param maxResults Maximum number of results to return
 * @returns Formatted suggestions sorted by relevance
 */
export function formatCommandSuggestions(suggestions: CommandSuggestion[], maxResults: number = 10): CommandSuggestion[] {
  return suggestions
    .slice(0, maxResults)
    .sort((a, b) => {
      // Sort by command name length first (shorter names first)
      const lengthDiff = a.name.length - b.name.length;
      if (lengthDiff !== 0) return lengthDiff;
      
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
}