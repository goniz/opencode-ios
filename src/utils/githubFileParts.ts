import type { FilePartInput } from '../api/types.gen';
import type { FilePartLike } from '../integrations/github/GitHubTypes';

/**
 * Converts a GitHub FilePartLike to a FilePartInput for API consumption
 * @param githubFilePart The GitHub file part to convert
 * @returns FilePartInput compatible with the OpenCode API
 */
export function convertGitHubFilePartToInput(githubFilePart: FilePartLike): FilePartInput {
  console.log(`🔍 [convertGitHubFilePartToInput] Converting file part: ${githubFilePart.name}`);
  console.log(`🔍 [convertGitHubFilePartToInput] File part metadata:`, githubFilePart.metadata?.github?.kind);
  
  // Verify content
  if (!githubFilePart.content || githubFilePart.content.trim().length === 0) {
    console.warn(`⚠️ [convertGitHubFilePartToInput] File part has empty content: ${githubFilePart.name}`);
  }
  
  // Convert the content to base64 data URI format
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(githubFilePart.content);
  
  // Convert Uint8Array to base64 string
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  const base64Content = btoa(binaryString);
  const dataUri = `data:${githubFilePart.mimeType};base64,${base64Content}`;

  const result: FilePartInput = {
    type: 'file',
    mime: githubFilePart.mimeType,
    filename: githubFilePart.name,
    url: dataUri
  };
  
  console.log(`✅ [convertGitHubFilePartToInput] Successfully converted ${githubFilePart.name} to FilePartInput`);
  
  return result;
}

/**
 * Converts multiple GitHub FilePartLike objects to FilePartInput array
 * @param githubFileParts Array of GitHub file parts to convert
 * @returns Array of FilePartInput objects
 */
export function convertGitHubFilePartsToInputs(githubFileParts: FilePartLike[]): FilePartInput[] {
  console.log('🔍 [convertGitHubFilePartsToInputs] Converting', githubFileParts.length, 'file parts');
  console.log('🔍 [convertGitHubFilePartsToInputs] File parts:', githubFileParts.map(part => ({
    name: part.name,
    type: part.type,
    metadataKind: part.metadata?.github?.kind
  })));
  
  const result = githubFileParts.map(convertGitHubFilePartToInput);
  console.log('🔍 [convertGitHubFilePartsToInputs] Conversion complete, returning', result.length, 'file part inputs');
  return result;
}