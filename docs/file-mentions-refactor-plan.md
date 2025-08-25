# File Mentions Refactoring Plan

## Overview

The current file mention system has several issues that need to be addressed:

1. **Text Matching Issues**: File suggestions don't always insert correctly due to cursor position and text replacement logic
2. **Incomplete File Part Integration**: When files are mentioned, they only insert text mentions (`@filepath`) but don't create proper `FilePart` objects in outgoing messages
3. **Missing API Integration**: File mentions should include both the text reference and actual file content via FilePart

This plan outlines a comprehensive refactoring to properly implement file mentions that include both text insertion and FilePart creation.

## Current State Analysis

### Current Implementation
- **FileSuggestions.tsx**: Displays file suggestions UI
- **fileMentions.ts**: Utilities for detecting, searching, and replacing file mentions
- **SmartTextInput.tsx**: Handles file suggestion interactions and text replacement
- **ConnectionContext.tsx**: Sends messages with text and image parts

### Identified Issues

1. **Text Replacement Logic**:
   - `getCurrentFileMention()` logic in `fileMentions.ts:83-112` may not accurately detect cursor position within mentions
   - `replaceFileMention()` in `fileMentions.ts:121-123` doesn't handle edge cases properly
   - File insertion sometimes fails when cursor is at specific positions

2. **Missing FilePart Creation**:
   - Messages only contain text parts with `@filepath` mentions
   - No FilePart objects are created despite the API supporting them
   - FilePart should include file content and metadata

3. **API Integration Gap**:
   - The `sessionChat` API expects parts array that can include FilePartInput
   - Current implementation only sends text and image parts
   - No integration with file reading API to get file content

## Refactoring Plan

### Phase 1: Enhanced File Mention Detection and Replacement ✅ COMPLETED

#### 1.1 Fix Text Matching Issues ✅
- **File**: `src/utils/fileMentions.ts`
- **Changes**:
  - ✅ Improve `getCurrentFileMention()` function to handle edge cases:
    - ✅ Cursor at beginning/end of mention
    - ✅ Multiple @ symbols in text
    - ✅ Whitespace handling
  - ✅ Enhance `replaceFileMention()` to be more robust:
    - ✅ Handle cursor position preservation
    - ✅ Support partial matches
    - ✅ Better whitespace management

#### 1.2 Add File Content Fetching ✅
- **File**: `src/utils/fileMentions.ts`
- **Changes**:
  - ✅ Add new function `fetchFileContent(filePath: string, client: Client): Promise<string>`
  - ✅ Integrate with `/file` API endpoint to read file content
  - ✅ Handle file read errors gracefully

#### 1.3 Create FilePart Factory ✅
- **File**: `src/utils/fileMentions.ts`
- **Changes**:
  - ✅ Add `createFilePartFromMention(mention: FileMention, client: Client): Promise<FilePartInput>`
  - ✅ Generate proper FilePart objects with:
    - ✅ `type: 'file'`
    - ✅ `mime: 'text/plain'` (or detect from file extension)
    - ✅ `url: string` (file path or content URI)
    - ✅ `filename: string` (extracted from path)
    - ✅ `source: FilePartSource` with file metadata

**Phase 1 Implementation Notes:**
- Enhanced `getCurrentFileMention()` with better edge case handling
- `replaceFileMention()` now returns both text and cursor position for better UX
- Added `fetchFileContent()` with proper API integration
- Created `createFilePartFromMention()` and `createFilePartsFromMentions()` factory functions
- Added MIME type detection for 15+ file extensions
- All tests updated and passing (13/13 tests pass)
- Full TypeScript support with enhanced FileMention interface

### Phase 2: Enhanced Message Composition ✅ COMPLETED

#### 2.1 File Mention Extraction ✅
- **File**: `src/utils/messageUtils.ts` (new file)
- **Changes**:
  - ✅ Add `extractFileMentionsFromText(text: string): FileMention[]`
  - ✅ Add `createFilePartsFromMentionsInMessage(mentions: FileMention[], client: Client): Promise<FilePartInput[]>`
  - ✅ Add message validation and sanitization

#### 2.2 Smart Text Processing ✅
- **File**: `src/utils/messageUtils.ts`
- **Changes**:
  - ✅ Add `processMessageForSending(text: string, client: Client, options?: MessageProcessingOptions): Promise<ProcessedMessage>`
  - ✅ Handle file mention detection and processing
  - ✅ Clean up text by removing processed file mentions or keeping them as references
  - ✅ Add configurable options for processing behavior
  - ✅ Add utility functions for message analysis

**Phase 2 Implementation Notes:**
- Created comprehensive `messageUtils.ts` with full message processing pipeline
- Added `ProcessedMessage` interface with textPart, fileParts, and invalidMentions
- Implemented configurable `MessageProcessingOptions` for flexible behavior
- Added text validation with length limits and sanitization
- Implemented duplicate file mention detection and removal
- Added utility functions: `hasFileMentions()`, `countFileMentions()`, `getFilePathsFromText()`
- Created comprehensive test suite with 21 passing tests
- Supports both keeping and removing file mention text from messages
- Includes protection against abuse with configurable limits

**Post-Phase 2 Bug Fixes:**
- ✅ Fixed TypeError: inputText.trim is not a function in chat.tsx
- ✅ Added explicit string type annotation to useState hook
- ✅ Added safety checks for undefined inputText values
- ✅ Updated FileAwareTextInput to handle new replaceFileMention API
- ✅ All tests passing (34/34 total across all test suites)

### Phase 3: Integration with Message Sending ✅ COMPLETED

#### 3.1 Update ConnectionContext ✅
- **File**: `src/contexts/ConnectionContext.tsx`
- **Changes**:
  - ✅ Modified `sendMessage()` function to use `processMessageForSending()`
  - ✅ Added file mention processing before sending messages
  - ✅ Integrated with existing image processing (file mentions + images work together)
  - ✅ Proper parts array construction with TextPartInput and FilePartInput types

#### 3.2 Error Handling and Validation ✅
- **File**: `src/contexts/ConnectionContext.tsx`
- **Changes**:
  - ✅ Added comprehensive error handling for file processing failures
  - ✅ Graceful fallback to original message processing if file processing fails
  - ✅ Validation that messages have content before sending
  - ✅ Logging for debugging and monitoring file processing

**Phase 3 Implementation Notes:**
- Integrated `processMessageForSending()` into the message sending pipeline
- Added proper error handling with fallback behavior
- Maintained compatibility with existing image processing
- Created comprehensive integration tests (8/8 passing)
- Added detailed logging for debugging file mention processing
- All TypeScript types properly defined and validated
- No breaking changes to existing functionality
  - Provide user feedback for invalid file mentions

### Phase 4: UI/UX Improvements

#### 4.1 Enhanced File Suggestions
- **File**: `src/components/chat/FileSuggestions.tsx`
- **Changes**:
  - Add file type icons based on extension
  - Show file size and last modified date
  - Add file preview for text files
  - Improve keyboard navigation

#### 4.2 Visual File Mention Indicators
- **File**: `src/components/chat/SmartTextInput.tsx`
- **Changes**:
  - Add visual highlighting for file mentions in text input
  - Show validation status (file exists/doesn't exist)
  - Add loading indicator while processing file mentions

#### 4.3 File Mention Display
- **File**: `src/components/chat/parts/FilePart.tsx` (new component)
- **Changes**:
  - Create dedicated component for displaying FilePart in messages
  - Show file metadata (name, size, type)
  - Provide file content preview or download
  - Handle different file types appropriately

### Phase 5: Testing and Validation

#### 5.1 Unit Tests
- **Files**: 
  - `__tests__/utils/fileMentions.test.ts` (enhance existing)
  - `__tests__/utils/messageUtils.test.ts` (new)
  - `__tests__/components/chat/parts/FilePart.test.tsx` (new)

#### 5.2 Integration Tests
- **File**: `__tests__/utils/fileMentions.integration.test.ts` (new)
- **Test scenarios**:
  - File mention detection and replacement
  - FilePart creation from file mentions
  - Message sending with file mentions
  - Error handling for invalid files

#### 5.3 E2E Tests
- **File**: `__tests__/chat-file-mentions.test.tsx` (new)
- **Test scenarios**:
  - Complete file mention workflow
  - File suggestion selection
  - Message sending with file parts
  - Error scenarios and recovery

## Implementation Details

### Updated Type Definitions

```typescript
// Enhanced FileMention interface
export interface FileMention {
  path: string;
  start: number;
  end: number;
  query: string;
  valid?: boolean; // Whether file exists
  content?: string; // File content when loaded
}

// File processing result
export interface ProcessedMessage {
  textPart: TextPartInput;
  fileParts: FilePartInput[];
  invalidMentions: FileMention[];
}
```

### Key API Integrations

1. **File Reading**: Use `/file?path={filePath}` endpoint
2. **File Existence Check**: Use `/find/file?query={fileName}` endpoint  
3. **File Metadata**: Extract from file path and API responses

### Error Handling Strategy

1. **File Not Found**: Show warning, keep text mention, don't create FilePart
2. **File Read Error**: Show error message, allow retry
3. **Network Error**: Queue for retry, show offline indicator
4. **Large File**: Warn user, offer alternatives (first N lines, summary)

## Migration Strategy

### Phase-by-Phase Rollout
1. **Phase 1-2**: Internal refactoring, no UI changes
2. **Phase 3**: Enable FilePart creation (feature flag)
3. **Phase 4**: UI improvements and enhanced UX
4. **Phase 5**: Full testing and validation

### Backward Compatibility
- Existing file mentions (`@filepath`) continue to work
- Progressive enhancement approach
- Graceful degradation for API failures

### Feature Flags
- `ENABLE_FILE_PART_CREATION`: Control FilePart generation
- `ENHANCED_FILE_SUGGESTIONS`: Control UI improvements
- `FILE_CONTENT_PREVIEW`: Control file preview features

## Success Criteria

1. **Reliability**: File suggestions insert correctly 99%+ of the time
2. **Functionality**: File mentions create both text and FilePart objects
3. **Performance**: No noticeable delay in typing or suggestion display
4. **User Experience**: Clear visual feedback for file mention states
5. **Error Handling**: Graceful handling of all error scenarios
6. **Test Coverage**: >95% coverage for file mention functionality

## Timeline Estimation

- **Phase 1**: 2-3 days (file mention fixes)
- **Phase 2**: 2-3 days (message composition)  
- **Phase 3**: 2-3 days (integration)
- **Phase 4**: 3-4 days (UI/UX improvements)
- **Phase 5**: 2-3 days (testing)

**Total**: 11-16 days for complete implementation

## Risk Assessment

### High Risk
- **File reading performance**: Large files could slow down message sending
- **API reliability**: File API failures could break functionality

### Medium Risk  
- **Text replacement complexity**: Edge cases in cursor positioning
- **Memory usage**: Storing file content in message parts

### Low Risk
- **UI consistency**: File part display matching existing patterns
- **Type safety**: TypeScript integration with existing types

## Conclusion

This refactoring will transform file mentions from simple text references to full-featured file integration, providing users with a seamless way to include file content in their conversations while maintaining the familiar `@filepath` syntax. The phased approach ensures stability and allows for iterative improvements based on user feedback.