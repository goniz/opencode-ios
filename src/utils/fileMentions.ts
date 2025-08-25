import { findFiles, fileRead } from '../api/sdk.gen';
import type { Client } from '../api/client';
import type { FilePartInput, FilePartSource } from '../api/types.gen';

export interface FileMention {
  path: string;
  start: number;
  end: number;
  query: string;
  valid?: boolean; // Whether file exists
  content?: string; // File content when loaded
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
 * Enhanced to handle edge cases like cursor at beginning/end and multiple @ symbols
 * @param text The full text
 * @param cursorPosition The current cursor position
 * @returns The current file mention or null if none found
 */
export function getCurrentFileMention(text: string, cursorPosition: number): { start: number; end: number; query: string } | null {
  // Handle edge cases
  if (!text || cursorPosition < 0 || cursorPosition > text.length) {
    return null;
  }

  // Look backwards from cursor to find @ symbol
  let start = -1;
  
  // Check if cursor is right after @ symbol
  if (cursorPosition > 0 && text[cursorPosition - 1] === '@') {
    start = cursorPosition - 1;
  } else {
    // Search backwards for @ symbol
    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = text[i];
      
      // If we hit whitespace or newline, stop searching
      if (char === ' ' || char === '\n' || char === '\t') {
        break;
      }
      
      // Found @ symbol
      if (char === '@') {
        start = i;
        break;
      }
    }
  }
  
  // No @ symbol found
  if (start === -1) {
    return null;
  }
  
  // Find the end of the mention
  let end = start + 1;
  while (end < text.length) {
    const char = text[end];
    
    // Stop at whitespace, newline, or another @ symbol
    if (char === ' ' || char === '\n' || char === '\t' || char === '@') {
      break;
    }
    
    end++;
  }
  
  // Cursor must be within the mention range (including at the boundaries)
  if (cursorPosition < start || cursorPosition > end) {
    return null;
  }
  
  // Extract the query (text after @)
  const query = text.slice(start + 1, end);
  
  // Ensure we have a valid query
  if (query.length === 0) {
    return { start, end, query: '' };
  }
  
  return { start, end, query };
}

/**
 * Replaces a file mention in text with the selected file path
 * Enhanced to handle cursor position preservation and edge cases
 * @param text The original text
 * @param mention The mention to replace
 * @param selectedPath The selected file path
 * @returns Object with updated text and new cursor position
 */
export function replaceFileMention(
  text: string, 
  mention: { start: number; end: number }, 
  selectedPath: string
): { text: string; cursorPosition: number } {
  // Validate inputs
  if (!text || mention.start < 0 || mention.end < mention.start || mention.end > text.length) {
    return { text, cursorPosition: mention.start };
  }
  
  // Ensure selectedPath is valid
  const sanitizedPath = selectedPath.trim();
  if (!sanitizedPath) {
    return { text, cursorPosition: mention.start };
  }
  
  // Build the replacement text with @ prefix and add a space after for better UX
  const replacement = `@${sanitizedPath} `;
  
  // Create the new text
  const newText = text.slice(0, mention.start) + replacement + text.slice(mention.end);
  
  // Calculate new cursor position (end of the replaced text)
  const newCursorPosition = mention.start + replacement.length;
  
  return {
    text: newText,
    cursorPosition: newCursorPosition
  };
}

/**
 * Legacy version for backward compatibility
 * @deprecated Use the enhanced version that returns cursor position
 */
export function replaceFileMentionLegacy(text: string, mention: { start: number; end: number }, selectedPath: string): string {
  const result = replaceFileMention(text, mention, selectedPath);
  return result.text;
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

/**
 * Fetches file content using the OpenCode API
 * @param filePath The path to the file to read
 * @param client The API client
 * @returns Promise resolving to the file content or null if error
 */
export async function fetchFileContent(filePath: string, client: Client): Promise<string | null> {
  if (!filePath || !filePath.trim()) {
    return null;
  }

  try {
    const response = await fileRead({
      client,
      query: { path: filePath.trim() }
    });

    if (response.data && typeof response.data.content === 'string') {
      return response.data.content;
    }

    return null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Detects file MIME type from file extension
 * @param filePath The file path
 * @returns MIME type string
 */
function getFileMimeType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'text/javascript';
    case 'ts':
    case 'tsx':
      return 'text/typescript';
    case 'json':
      return 'application/json';
    case 'html':
    case 'htm':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'md':
    case 'markdown':
      return 'text/markdown';
    case 'xml':
      return 'text/xml';
    case 'yaml':
    case 'yml':
      return 'text/yaml';
    case 'py':
      return 'text/x-python';
    case 'java':
      return 'text/x-java-source';
    case 'c':
      return 'text/x-c';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'text/x-c++';
    case 'sh':
    case 'bash':
      return 'text/x-shellscript';
    default:
      return 'text/plain';
  }
}

/**
 * Extracts filename from file path
 * @param filePath The file path
 * @returns The filename
 */
function getFilename(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

/**
 * Creates a FilePartInput object from a file mention
 * @param mention The file mention containing path and query info
 * @param client The API client for fetching file content
 * @returns Promise resolving to FilePartInput or null if error
 */
export async function createFilePartFromMention(
  mention: FileMention, 
  client: Client
): Promise<FilePartInput | null> {
  if (!mention.path || !mention.path.trim()) {
    return null;
  }

  const filePath = mention.path.trim();
  
  try {
    // Fetch file content
    const content = await fetchFileContent(filePath, client);
    if (content === null) {
      return null;
    }

    // Create the FilePartInput object
    const filePartInput: FilePartInput = {
      type: 'file',
      mime: getFileMimeType(filePath),
      filename: getFilename(filePath),
      url: filePath, // Use file path as URL
      source: {
        type: 'file',
        path: filePath,
        text: {
          value: content,
          start: 0,
          end: content.length
        }
      } as FilePartSource
    };

    return filePartInput;
  } catch (error) {
    console.error(`Error creating FilePart from mention for ${filePath}:`, error);
    return null;
  }
}

/**
 * Creates multiple FilePartInput objects from an array of file mentions
 * @param mentions Array of file mentions
 * @param client The API client
 * @returns Promise resolving to array of FilePartInput objects (excluding failures)
 */
export async function createFilePartsFromMentions(
  mentions: FileMention[], 
  client: Client
): Promise<FilePartInput[]> {
  if (!mentions || mentions.length === 0) {
    return [];
  }

  // Process all mentions concurrently
  const filePartPromises = mentions.map(mention => 
    createFilePartFromMention(mention, client)
  );

  try {
    const results = await Promise.allSettled(filePartPromises);
    
    // Filter out failed results and null values
    return results
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter((filePart): filePart is FilePartInput => filePart !== null);
  } catch (error) {
    console.error('Error creating FileParts from mentions:', error);
    return [];
  }
}