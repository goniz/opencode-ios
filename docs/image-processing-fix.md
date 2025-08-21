# Image Processing Fix: Duplicate MIME Type Issue

## Problem
The code was generating a duplicate base64 MIME type prefix in image URIs, resulting in malformed data like:
```
data:image/png;base64,data:image/png;base64,iVBORw0KGgoAAAANSUh...
```

## Root Cause
The issue occurred in the `sendMessage` function in `ConnectionContext.tsx` where:
1. File URIs were being converted to full data URIs with prefix
2. The full data URI (including prefix) was being assigned to the `url` property
3. This caused the server/API to receive the complete data URI instead of just the base64 data

## Solution

### 1. Extracted Image Processing to Separate Module
Created `src/utils/imageProcessing.ts` with:
- `processImageUri()`: Handles both `file://` and `data:` URIs
- `processImageUris()`: Processes multiple URIs
- Proper separation of concerns for easier testing and maintenance

### 2. Fixed Data Structure
The processed image now returns:
```typescript
interface ProcessedImage {
  mime: string;        // e.g., "image/png" 
  base64Data: string;  // Just the base64 data, no prefix
  filename: string;    // Extracted or generated filename
}
```

### 3. Clean API Request Format
The API request now sends:
```javascript
{
  type: 'file',
  mime: 'image/png',
  url: 'iVBORw0KGgoAAAANSUh...', // Clean base64 data only
  filename: 'image.png'
}
```

## Key Changes

### Before (in ConnectionContext.tsx)
```typescript
// Created full data URI
dataUri = `data:${detectedMimeType};base64,${base64}`;

// Then tried to extract base64 part, but logic was flawed
url: dataUri.startsWith('data:') ? dataUri.split(',')[1] : dataUri
```

### After
```typescript
// In imageProcessing.ts - returns clean data
return {
  mime: detectedMimeType,
  base64Data: base64, // Just the base64 string
  filename: filename
};

// In ConnectionContext.tsx - uses clean data directly
parts.push({
  type: 'file',
  mime: processedImage.mime,
  url: processedImage.base64Data, // No duplicate prefixes
  filename: processedImage.filename
});
```

## Testing
- **55 comprehensive tests** covering both `file://` and `data:` URI processing
- **Integration tests** specifically verifying the duplicate prefix fix
- **Edge cases** including malformed URIs, different image formats, and error handling

## Supported Formats
- **File URIs**: `file:///path/to/image.jpg`
- **Data URIs**: `data:image/png;base64,iVBORw0KGgo...`
- **Image types**: JPEG, PNG, WebP, GIF, BMP, SVG, TIFF
- **MIME type normalization**: `image/jpg` → `image/jpeg`

## Benefits
1. **Fixed duplicate prefix bug** - No more malformed data URIs
2. **Improved maintainability** - Separated image processing logic
3. **Better testing** - Focused unit tests without complex mocking
4. **Type safety** - Proper TypeScript interfaces
5. **Error handling** - Clear error messages for unsupported formats