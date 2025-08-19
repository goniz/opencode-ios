import { findFiles } from '../api/sdk.gen';
import type { Client } from '../api/client';

export interface FileMention {
  path: string;
  start: number;
  end: number;
  query: string;
}

export interface FileSuggestion {
  path: string;
  fileName: string;
  directory: string;
}

/**
 * Detects file mentions in text using the @file syntax
 * @param text The text to search for file mentions
 * @returns Array of file mentions found in the text
 */
export function detectFileMentions(text: string): FileMention[] {
  const mentions: FileMention[] = [];
  const regex = /@([^\s@]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      path: match[1],
      start: match.index,
      end: match.index + match[0].length,
      query: match[1]
    });
  }

  return mentions;
}

/**
 * Searches for files based on a query using the OpenCode API
 * @param query The search query
 * @param client The API client
 * @returns Promise resolving to an array of file suggestions
 */
export async function searchFiles(query: string, client: Client): Promise<FileSuggestion[]> {
  if (!query || query.length < 1) {
    return [];
  }

  try {
    const response = await findFiles({ 
      client,
      query: { query }
    });

    if (response.data) {
      return response.data.map(filePath => {
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1] || filePath;
        const directory = parts.slice(0, -1).join('/') || '/';
        
        return {
          path: filePath,
          fileName,
          directory
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Error searching files:', error);
    return [];
  }
}

/**
 * Gets the current file mention being typed based on cursor position
 * @param text The full text
 * @param cursorPosition The current cursor position
 * @returns The current file mention or null if none found
 */
export function getCurrentFileMention(text: string, cursorPosition: number): { start: number; end: number; query: string } | null {
  // Look for @ symbol before cursor position
  let start = cursorPosition - 1;
  
  // Find the start of the mention (@ symbol)
  while (start >= 0 && text[start] !== '@') {
    if (text[start] === ' ' || text[start] === '\n') {
      return null; // Hit whitespace before finding @
    }
    start--;
  }
  
  if (start < 0 || text[start] !== '@') {
    return null; // No @ found
  }
  
  // Find the end of the mention (whitespace or end of string)
  let end = start + 1;
  while (end < text.length && text[end] !== ' ' && text[end] !== '\n' && text[end] !== '@') {
    end++;
  }
  
  // If cursor is not within the mention, return null
  if (cursorPosition < start || cursorPosition > end) {
    return null;
  }
  
  const query = text.slice(start + 1, end);
  return { start, end, query };
}

/**
 * Replaces a file mention in text with the selected file path
 * @param text The original text
 * @param mention The mention to replace
 * @param selectedPath The selected file path
 * @returns The updated text with the mention replaced
 */
export function replaceFileMention(text: string, mention: { start: number; end: number }, selectedPath: string): string {
  return text.slice(0, mention.start) + `@${selectedPath}` + text.slice(mention.end);
}

/**
 * Formats file suggestions for display
 * @param suggestions Array of file suggestions
 * @param maxResults Maximum number of results to return
 * @returns Formatted suggestions sorted by relevance
 */
export function formatFileSuggestions(suggestions: FileSuggestion[], maxResults: number = 10): FileSuggestion[] {
  return suggestions
    .slice(0, maxResults)
    .sort((a, b) => {
      // Sort by file name length first (shorter names first)
      const lengthDiff = a.fileName.length - b.fileName.length;
      if (lengthDiff !== 0) return lengthDiff;
      
      // Then sort alphabetically
      return a.fileName.localeCompare(b.fileName);
    });
}