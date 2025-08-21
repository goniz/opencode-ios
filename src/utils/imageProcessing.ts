// Image processing utilities for handling file:// and data: URIs
// Used by ConnectionContext for preparing images for API calls

export interface ProcessedImage {
  mime: string;
  base64Data: string;
  filename: string;
}

// Utility functions for image processing
export const detectMimeTypeFromUri = (uri: string): string => {
  const extension = uri.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    default:
      return 'image/png'; // Default fallback
  }
};

export const detectMimeTypeFromDataUri = (dataUri: string): string => {
  const mimeMatch = dataUri.match(/^data:([^;]+);base64,/);
  return mimeMatch ? mimeMatch[1] : 'image/png';
};

export const validateImageMimeType = (mimeType: string): string => {
  const validImageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'
  ];
  
  // Normalize jpeg variants
  if (mimeType === 'image/jpg') {
    return 'image/jpeg';
  }
  
  return validImageTypes.includes(mimeType) ? mimeType : 'image/png';
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const extractFilenameFromUri = (uri: string, mimeType: string): string => {
  if (uri.startsWith('file://')) {
    // Extract filename from file URI
    const parts = uri.split('/');
    const filename = parts[parts.length - 1];
    if (filename && filename.includes('.')) {
      return filename;
    }
  }
  
  // Generate a filename based on MIME type and timestamp
  const getExtensionFromMimeType = (mime: string): string => {
    switch (mime) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      case 'image/webp':
        return 'webp';
      case 'image/bmp':
        return 'bmp';
      case 'image/svg+xml':
        return 'svg';
      case 'image/tiff':
        return 'tiff';
      default:
        return 'png';
    }
  };
  
  const extension = getExtensionFromMimeType(mimeType);
  const timestamp = new Date().getTime();
  return `image_${timestamp}.${extension}`;
};

/**
 * Processes a single image URI (file:// or data:) and returns processed image data
 * @param imageUri - The URI to process (file:// or data: format)
 * @returns Promise<ProcessedImage> - Object containing mime type, base64 data, and filename
 * @throws Error if the URI format is unsupported or processing fails
 */
export const processImageUri = async (imageUri: string): Promise<ProcessedImage> => {
  let detectedMimeType = 'image/png';
  let base64Data = '';
  
  if (imageUri.startsWith('file://')) {
    // Handle file URI
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Priority order for MIME type detection:
      // 1. Blob type (most reliable)
      // 2. File extension from URI
      // 3. Default fallback
      detectedMimeType = blob.type || detectMimeTypeFromUri(imageUri);
      
      // Validate and normalize the MIME type
      detectedMimeType = validateImageMimeType(detectedMimeType);
      
      // Convert blob to base64
      base64Data = await blobToBase64(blob);
      
      console.log(`Converted file URI to base64: ${imageUri} -> ${detectedMimeType} (blob: ${blob.type}, uri: ${detectMimeTypeFromUri(imageUri)})`);
    } catch (error) {
      console.error('Failed to convert file URI to base64:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (imageUri.startsWith('data:')) {
    // Handle data URI
    detectedMimeType = detectMimeTypeFromDataUri(imageUri);
    detectedMimeType = validateImageMimeType(detectedMimeType);
    
    // Extract the base64 data part (everything after the comma)
    const base64Match = imageUri.match(/^data:[^;]+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Malformed data URI - missing base64 data');
    }
    
    base64Data = base64Match[1];
    
    console.log(`Data URI detected MIME type: ${detectedMimeType}`);
  } else {
    console.warn(`Unknown image URI format: ${imageUri}`);
    throw new Error('Unsupported image URI format');
  }
  
  // Extract or generate filename
  const filename = extractFilenameFromUri(imageUri, detectedMimeType);
  
  console.log(`Processed image: ${filename} (${detectedMimeType})`);
  
  return {
    mime: detectedMimeType,
    base64Data,
    filename
  };
};

/**
 * Processes multiple image URIs and returns an array of processed images
 * @param imageUris - Array of URIs to process
 * @returns Promise<ProcessedImage[]> - Array of processed image objects
 * @throws Error if any URI fails to process
 */
export const processImageUris = async (imageUris: string[]): Promise<ProcessedImage[]> => {
  const processedImages: ProcessedImage[] = [];
  
  for (const imageUri of imageUris) {
    const processed = await processImageUri(imageUri);
    processedImages.push(processed);
  }
  
  return processedImages;
};