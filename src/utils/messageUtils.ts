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
  console.log('🔍 [createFilePartsFromMentionsInMessage] Starting FilePart creation...');
  console.log('🔍 [createFilePartsFromMentionsInMessage] Input mentions:', mentions.map(m => ({ path: m.path, start: m.start, end: m.end })));
  console.log('🔍 [createFilePartsFromMentionsInMessage] Client available:', !!client);

  const { maxFileParts = DEFAULT_OPTIONS.maxFileParts } = options;
  console.log('🔍 [createFilePartsFromMentionsInMessage] maxFileParts limit:', maxFileParts);

  if (!mentions || mentions.length === 0) {
    console.log('🔍 [createFilePartsFromMentionsInMessage] No mentions provided, returning empty array');
    return [];
  }

  // Limit the number of file parts to process
  const limitedMentions = mentions.slice(0, maxFileParts);
  console.log('🔍 [createFilePartsFromMentionsInMessage] Limited mentions count:', limitedMentions.length);

  if (limitedMentions.length < mentions.length) {
    console.warn(`⚠️ [createFilePartsFromMentionsInMessage] Message processing limited to ${maxFileParts} file parts. ${mentions.length - maxFileParts} file mentions were skipped.`);
  }

  console.log('🔍 [createFilePartsFromMentionsInMessage] Calling createFilePartsFromMentions...');
  const result = await createFilePartsFromMentions(limitedMentions, client);
  console.log('🔍 [createFilePartsFromMentionsInMessage] createFilePartsFromMentions returned:', result.length, 'FileParts');

  return result;
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
  console.log('🔍 [processMessageForSending] Starting message processing...');
  console.log('🔍 [processMessageForSending] Input text:', JSON.stringify(text));
  console.log('🔍 [processMessageForSending] Client available:', !!client);

  const opts = { ...DEFAULT_OPTIONS, ...options };
  console.log('🔍 [processMessageForSending] Options:', opts);

  // Validate input text
  console.log('🔍 [processMessageForSending] Validating message text...');
  const validation = validateMessageText(text);
  console.log('🔍 [processMessageForSending] Validation result:', {
    isValid: validation.isValid,
    errors: validation.errors,
    cleanedTextLength: validation.cleanedText.length
  });

  if (!validation.isValid) {
    console.warn('⚠️ [processMessageForSending] Message validation failed:', validation.errors);
    // Return a basic text part even if validation fails, but log the issues
  }

  const cleanedText = validation.cleanedText;
  console.log('🔍 [processMessageForSending] Using cleaned text:', JSON.stringify(cleanedText));

  // Extract file mentions from text
  console.log('🔍 [processMessageForSending] Extracting file mentions...');
  const mentions = extractFileMentionsFromText(cleanedText);
  console.log(`🔍 [processMessageForSending] Found ${mentions.length} file mentions:`,
    mentions.map(m => ({ path: m.path, start: m.start, end: m.end })));

  if (mentions.length === 0) {
    console.log('🔍 [processMessageForSending] No file mentions found, returning simple text part');
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
  console.log('🔍 [processMessageForSending] Creating FileParts from mentions...');
  console.log('🔍 [processMessageForSending] Calling createFilePartsFromMentionsInMessage...');

  let fileParts: FilePartInput[] = [];
  try {
    fileParts = await createFilePartsFromMentionsInMessage(mentions, client, {
      maxFileParts: opts.maxFileParts
    });
    console.log(`🔍 [processMessageForSending] Successfully created ${fileParts.length} FileParts:`,
      fileParts.map(fp => ({ filename: fp.filename, mime: fp.mime, url: fp.url })));
  } catch (error) {
    console.error('❌ [processMessageForSending] Error creating FileParts:', error);
    console.log('🔍 [processMessageForSending] Continuing with empty fileParts array');
    fileParts = [];
  }

  // Determine which mentions were successfully converted to FileParts
  console.log('🔍 [processMessageForSending] Analyzing processing results...');
  const successfulPaths = new Set(fileParts.map(fp => fp.source?.path || fp.url));
  console.log('🔍 [processMessageForSending] Successful file paths:', Array.from(successfulPaths));

  const validMentions = mentions.filter(m => successfulPaths.has(m.path));
  const invalidMentions = mentions.filter(m => !successfulPaths.has(m.path));

  console.log(`🔍 [processMessageForSending] Valid mentions: ${validMentions.length}, Invalid mentions: ${invalidMentions.length}`);
  console.log('🔍 [processMessageForSending] Invalid mentions:', invalidMentions.map(m => m.path));

  if (invalidMentions.length > 0) {
    console.warn(`⚠️ [processMessageForSending] Failed to create FileParts for ${invalidMentions.length} mentions:`,
      invalidMentions.map(m => m.path));
  }

  // Determine final text content
  console.log('🔍 [processMessageForSending] Determining final text content...');
  let finalText = cleanedText;
  console.log('🔍 [processMessageForSending] keepMentionText option:', opts.keepMentionText);
  console.log('🔍 [processMessageForSending] validMentions count:', validMentions.length);

  if (!opts.keepMentionText && validMentions.length > 0) {
    console.log('🔍 [processMessageForSending] Removing file mentions from text...');
    // Remove file mentions from text since they're now FileParts
    finalText = removeMentionsFromText(cleanedText, validMentions);
    console.log('🔍 [processMessageForSending] Text after removing mentions:', JSON.stringify(finalText));

    // If removing mentions left us with empty text, keep original text
    if (!finalText.trim()) {
      console.log('🔍 [processMessageForSending] Removing mentions left empty text, keeping original');
      finalText = cleanedText;
      console.warn('⚠️ [processMessageForSending] Removing file mentions would leave empty text, keeping original text');
    }
  } else {
    console.log('🔍 [processMessageForSending] Keeping original text with mentions');
  }

  console.log(`✅ [processMessageForSending] Message processing complete: ${fileParts.length} FileParts created, ${invalidMentions.length} invalid mentions`);
  console.log('✅ [processMessageForSending] Final result:', {
    textPart: { type: 'text', text: finalText },
    filePartsCount: fileParts.length,
    invalidMentionsCount: invalidMentions.length
  });

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