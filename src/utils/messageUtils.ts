import type { Client } from '../api/client';
import type { TextPartInput, FilePartInput } from '../api/types.gen';
import { 
  detectFileMentions, 
  createFilePartsFromMentions, 
  type FileMention 
} from './fileMentions';

/**
 * Result of processing a message for sending
 */
export interface ProcessedMessage {
  textPart: TextPartInput;
  fileParts: FilePartInput[];
  invalidMentions: FileMention[];
}

/**
 * Configuration options for message processing
 */
export interface MessageProcessingOptions {
  /**
   * Whether to keep file mention text (@filepath) in the text part
   * If false, file mentions are removed from text after creating FileParts
   */
  keepMentionText?: boolean;
  
  /**
   * Maximum number of file parts to process (to prevent abuse)
   */
  maxFileParts?: number;
  
  /**
   * Whether to validate file existence before creating FileParts
   */
  validateFiles?: boolean;
}

/**
 * Default options for message processing
 */
const DEFAULT_OPTIONS: Required<MessageProcessingOptions> = {
  keepMentionText: true, // Keep @filepath references for context
  maxFileParts: 10, // Reasonable limit to prevent abuse
  validateFiles: true
};

/**
 * Extracts file mentions from text using the @file syntax
 * @param text The text to search for file mentions
 * @returns Array of unique file mentions found in the text
 */
export function extractFileMentionsFromText(text: string): FileMention[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const mentions = detectFileMentions(text);
  
  // Remove duplicates based on file path
  const uniqueMentions = mentions.filter((mention, index, array) => {
    return array.findIndex(m => m.path === mention.path) === index;
  });
  
  return uniqueMentions;
}

/**
 * Creates FilePartInput objects from an array of file mentions
 * This is a wrapper around the fileMentions utility for better organization
 * @param mentions Array of file mentions
 * @param client The API client
 * @returns Promise resolving to array of FilePartInput objects
 */
export async function createFilePartsFromMentionsInMessage(
  mentions: FileMention[], 
  client: Client,
  options: Pick<MessageProcessingOptions, 'maxFileParts'> = {}
): Promise<FilePartInput[]> {
  const { maxFileParts = DEFAULT_OPTIONS.maxFileParts } = options;
  
  if (!mentions || mentions.length === 0) {
    return [];
  }
  
  // Limit the number of file parts to process
  const limitedMentions = mentions.slice(0, maxFileParts);
  
  if (limitedMentions.length < mentions.length) {
    console.warn(`Message processing limited to ${maxFileParts} file parts. ${mentions.length - maxFileParts} file mentions were skipped.`);
  }
  
  return createFilePartsFromMentions(limitedMentions, client);
}

/**
 * Removes file mentions from text
 * @param text Original text
 * @param mentions File mentions to remove
 * @returns Text with file mentions removed
 */
function removeMentionsFromText(text: string, mentions: FileMention[]): string {
  if (!mentions || mentions.length === 0) {
    return text;
  }
  
  // Sort mentions by start position in descending order
  // This ensures we remove from right to left to maintain correct positions
  const sortedMentions = [...mentions].sort((a, b) => b.start - a.start);
  
  let cleanedText = text;
  for (const mention of sortedMentions) {
    const beforeMention = cleanedText.slice(0, mention.start);
    const afterMention = cleanedText.slice(mention.end);
    
    // Join parts and clean up extra whitespace
    cleanedText = (beforeMention + ' ' + afterMention).replace(/\s+/g, ' ').trim();
  }
  
  return cleanedText;
}

/**
 * Validates text content for message sending
 * @param text The text to validate
 * @returns Object with validation result and cleaned text
 */
function validateMessageText(text: string): { isValid: boolean; cleanedText: string; errors: string[] } {
  const errors: string[] = [];
  let cleanedText = text;
  
  if (!text || typeof text !== 'string') {
    return { isValid: false, cleanedText: '', errors: ['Text must be a non-empty string'] };
  }
  
  // Trim whitespace
  cleanedText = text.trim();
  
  // Check if text is empty after trimming
  if (cleanedText.length === 0) {
    return { isValid: false, cleanedText: '', errors: ['Text cannot be empty'] };
  }
  
  // Check for reasonable length limits (e.g., 50KB max)
  const MAX_TEXT_LENGTH = 50 * 1024;
  if (cleanedText.length > MAX_TEXT_LENGTH) {
    errors.push(`Text too long (${cleanedText.length} chars). Maximum allowed: ${MAX_TEXT_LENGTH} chars`);
    cleanedText = cleanedText.slice(0, MAX_TEXT_LENGTH);
  }
  
  return { 
    isValid: errors.length === 0, 
    cleanedText, 
    errors 
  };
}

/**
 * Processes a message for sending by extracting file mentions and creating appropriate parts
 * This is the main function for Phase 2 that integrates all message processing logic
 * @param text The message text to process
 * @param client The API client for fetching file content
 * @param options Processing options
 * @returns Promise resolving to ProcessedMessage with text and file parts
 */
export async function processMessageForSending(
  text: string,
  client: Client,
  options: MessageProcessingOptions = {}
): Promise<ProcessedMessage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate input text
  const validation = validateMessageText(text);
  if (!validation.isValid) {
    console.warn('Message validation failed:', validation.errors);
    // Return a basic text part even if validation fails, but log the issues
  }
  
  const cleanedText = validation.cleanedText;
  
  // Extract file mentions from text
  const mentions = extractFileMentionsFromText(cleanedText);
  console.log(`Found ${mentions.length} file mentions in message`);
  
  if (mentions.length === 0) {
    // No file mentions, return simple text part
    return {
      textPart: {
        type: 'text',
        text: cleanedText
      },
      fileParts: [],
      invalidMentions: []
    };
  }
  
  // Create FilePart objects from mentions
  console.log('Creating FileParts from mentions...');
  const fileParts = await createFilePartsFromMentionsInMessage(mentions, client, {
    maxFileParts: opts.maxFileParts
  });
  
  // Determine which mentions were successfully converted to FileParts
  const successfulPaths = new Set(fileParts.map(fp => fp.url));
  const validMentions = mentions.filter(m => successfulPaths.has(m.path));
  const invalidMentions = mentions.filter(m => !successfulPaths.has(m.path));
  
  if (invalidMentions.length > 0) {
    console.warn(`Failed to create FileParts for ${invalidMentions.length} mentions:`, 
      invalidMentions.map(m => m.path));
  }
  
  // Determine final text content
  let finalText = cleanedText;
  if (!opts.keepMentionText && validMentions.length > 0) {
    // Remove file mentions from text since they're now FileParts
    finalText = removeMentionsFromText(cleanedText, validMentions);
    
    // If removing mentions left us with empty text, keep original text
    if (!finalText.trim()) {
      finalText = cleanedText;
      console.warn('Removing file mentions would leave empty text, keeping original text');
    }
  }
  
  console.log(`Message processing complete: ${fileParts.length} FileParts created, ${invalidMentions.length} invalid mentions`);
  
  return {
    textPart: {
      type: 'text',
      text: finalText
    },
    fileParts,
    invalidMentions
  };
}

/**
 * Utility function to check if a message contains file mentions
 * @param text The text to check
 * @returns True if the text contains file mentions
 */
export function hasFileMentions(text: string): boolean {
  return extractFileMentionsFromText(text).length > 0;
}

/**
 * Utility function to count file mentions in text
 * @param text The text to analyze
 * @returns Number of unique file mentions found
 */
export function countFileMentions(text: string): number {
  return extractFileMentionsFromText(text).length;
}

/**
 * Utility function to get file paths from mentions in text
 * @param text The text to analyze
 * @returns Array of unique file paths mentioned
 */
export function getFilePathsFromText(text: string): string[] {
  return extractFileMentionsFromText(text).map(m => m.path);
}