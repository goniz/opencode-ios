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
  console.log('🔍 [fetchFileContent] Starting file content fetch...');
  console.log('🔍 [fetchFileContent] Input filePath:', JSON.stringify(filePath));
  console.log('🔍 [fetchFileContent] Client available:', !!client);

  if (!filePath || !filePath.trim()) {
    console.log('🔍 [fetchFileContent] Invalid filePath, returning null');
    return null;
  }

  const trimmedPath = filePath.trim();
  console.log('🔍 [fetchFileContent] Using trimmed path:', JSON.stringify(trimmedPath));

  try {
    console.log('🔍 [fetchFileContent] Calling fileRead API...');
    const response = await fileRead({
      client,
      query: { path: trimmedPath }
    });

    console.log('🔍 [fetchFileContent] fileRead API response received');
    console.log('🔍 [fetchFileContent] Response data exists:', !!response.data);
    console.log('🔍 [fetchFileContent] Response data type:', typeof response.data);

    if (response.data) {
      console.log('🔍 [fetchFileContent] Response data keys:', Object.keys(response.data));
      console.log('🔍 [fetchFileContent] Response data content type:', typeof response.data.content);
      console.log('🔍 [fetchFileContent] Response data content length:', response.data.content?.length || 0);
    }

    if (response.data && typeof response.data.content === 'string') {
      console.log('✅ [fetchFileContent] Successfully retrieved file content, length:', response.data.content.length);
      return response.data.content;
    }

    console.log('🔍 [fetchFileContent] Response data or content is invalid, returning null');
    return null;
  } catch (error) {
    console.error(`❌ [fetchFileContent] Error reading file ${trimmedPath}:`, error);
    console.error('❌ [fetchFileContent] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
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
  console.log('🔍 [createFilePartFromMention] Starting FilePart creation for mention:', {
    path: mention.path,
    start: mention.start,
    end: mention.end,
    query: mention.query
  });
  console.log('🔍 [createFilePartFromMention] Client available:', !!client);

  if (!mention.path || !mention.path.trim()) {
    console.log('🔍 [createFilePartFromMention] Invalid mention path, returning null');
    return null;
  }

  const filePath = mention.path.trim();
  console.log('🔍 [createFilePartFromMention] Processing file path:', JSON.stringify(filePath));

  try {
    console.log('🔍 [createFilePartFromMention] Fetching file content...');
    // Fetch file content
    const content = await fetchFileContent(filePath, client);
    console.log('🔍 [createFilePartFromMention] fetchFileContent returned:', {
      contentLength: content?.length || 0,
      contentType: typeof content,
      isNull: content === null
    });

    if (content === null) {
      console.log('🔍 [createFilePartFromMention] File content is null, returning null');
      return null;
    }

    console.log('🔍 [createFilePartFromMention] Creating FilePartInput object...');
    const mimeType = getFileMimeType(filePath);
    const filename = getFilename(filePath);

    console.log('🔍 [createFilePartFromMention] File metadata:', {
      mimeType,
      filename,
      filePath,
      contentLength: content.length
    });

    // Create the FilePartInput object
    const filePartInput: FilePartInput = {
      type: 'file',
      mime: mimeType,
      filename: filename,
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

    console.log('✅ [createFilePartFromMention] Successfully created FilePartInput:', {
      type: filePartInput.type,
      mime: filePartInput.mime,
      filename: filePartInput.filename,
      url: filePartInput.url,
      sourceType: filePartInput.source?.type,
      contentLength: content.length,
      sourceContentLength: filePartInput.source?.text?.value?.length || 0,
      sourceTextPreview: filePartInput.source?.text?.value?.substring(0, 100) + '...' || 'none'
    });

    // Validate the created FilePartInput
    console.log('🔍 [createFilePartFromMention] Validating created FilePartInput:', {
      hasType: !!filePartInput.type,
      hasMime: !!filePartInput.mime,
      hasFilename: !!filePartInput.filename,
      hasUrl: !!filePartInput.url,
      hasSource: !!filePartInput.source,
      sourceType: filePartInput.source?.type,
      isValid: !!(
        filePartInput.type &&
        filePartInput.mime &&
        filePartInput.filename &&
        filePartInput.url &&
        filePartInput.source
      )
    });

    return filePartInput;
  } catch (error) {
    console.error(`❌ [createFilePartFromMention] Error creating FilePart from mention for ${filePath}:`, error);
    console.error('❌ [createFilePartFromMention] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
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
  console.log('🔍 [createFilePartsFromMentions] Starting batch FilePart creation...');
  console.log('🔍 [createFilePartsFromMentions] Input mentions:', mentions.map(m => ({ path: m.path, start: m.start, end: m.end })));
  console.log('🔍 [createFilePartsFromMentions] Client available:', !!client);

  if (!mentions || mentions.length === 0) {
    console.log('🔍 [createFilePartsFromMentions] No mentions provided, returning empty array');
    return [];
  }

  console.log('🔍 [createFilePartsFromMentions] Processing mentions concurrently...');

  // Process all mentions concurrently
  const filePartPromises = mentions.map((mention, index) => {
    console.log(`🔍 [createFilePartsFromMentions] Processing mention ${index + 1}/${mentions.length}:`, mention.path);
    return createFilePartFromMention(mention, client);
  });

  console.log('🔍 [createFilePartsFromMentions] Waiting for all promises to resolve...');

  try {
    const results = await Promise.allSettled(filePartPromises);
    console.log('🔍 [createFilePartsFromMentions] Promise.allSettled completed with', results.length, 'results');

    // Analyze results
    const fulfilledResults = results.filter(result => result.status === 'fulfilled');
    const rejectedResults = results.filter(result => result.status === 'rejected');

    console.log(`🔍 [createFilePartsFromMentions] Fulfilled: ${fulfilledResults.length}, Rejected: ${rejectedResults.length}`);

    if (rejectedResults.length > 0) {
      console.warn('⚠️ [createFilePartsFromMentions] Some FilePart creations failed:');
      rejectedResults.forEach((result, index) => {
        console.warn(`⚠️ [createFilePartsFromMentions] Failed mention ${index}:`, result.reason);
      });
    }

    // Filter out failed results and null values
    const fileParts = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          const filePart = result.value;
          if (filePart) {
            console.log(`🔍 [createFilePartsFromMentions] Success for mention ${index}:`, {
              filename: filePart.filename,
              mime: filePart.mime,
              url: filePart.url
            });
            return filePart;
          } else {
            console.log(`🔍 [createFilePartsFromMentions] Null result for mention ${index}`);
            return null;
          }
        } else {
          console.log(`🔍 [createFilePartsFromMentions] Rejected result for mention ${index}:`, result.reason);
          return null;
        }
      })
      .filter((filePart): filePart is FilePartInput => filePart !== null);

    console.log(`✅ [createFilePartsFromMentions] Returning ${fileParts.length} successful FileParts`);
    return fileParts;
  } catch (error) {
    console.error('❌ [createFilePartsFromMentions] Unexpected error in Promise.allSettled:', error);
    return [];
  }
}