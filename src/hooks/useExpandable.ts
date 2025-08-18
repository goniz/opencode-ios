import { useState, useEffect, useMemo } from 'react';

export interface UseExpandableOptions {
  content: string;
  maxLines?: number;
  estimatedCharsPerLine?: number;
  autoExpand?: boolean;
  contentType?: 'text' | 'code' | 'terminal' | 'tool' | 'reasoning';
}

export interface UseExpandableReturn {
  isExpanded: boolean;
  shouldShowExpandButton: boolean;
  displayContent: string;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export function useExpandable({
  content,
  maxLines = 3,
  estimatedCharsPerLine = 50,
  autoExpand = false,
  contentType = 'text'
}: UseExpandableOptions): UseExpandableReturn {
  const [isExpanded, setIsExpanded] = useState(autoExpand);

  // Reset expansion state when content changes
  useEffect(() => {
    setIsExpanded(autoExpand);
  }, [content, autoExpand]);

  // Calculate if content needs expansion based on content type
  const shouldShowExpandButton = useMemo(() => {
    if (!content) return false;

    // Different logic for different content types
    switch (contentType) {
      case 'code':
        // Code blocks are always fully visible
        return false;
        
      case 'terminal':
        // Terminal output collapses after 7 lines
        const terminalLines = content.split('\n').length;
        return terminalLines > 7;
        
      case 'tool':
        // Tool results collapse if longer than 200 chars or 5 lines
        const toolLines = content.split('\n').length;
        return content.length > 200 || toolLines > 5;
        
      case 'reasoning':
        // Reasoning collapses after 400 chars or more than maxLines
        const reasoningLines = Math.ceil(content.length / estimatedCharsPerLine);
        return content.length > 400 || reasoningLines > maxLines;
        
      case 'text':
      default:
        // Text content collapses based on estimated lines
        const estimatedLines = Math.ceil(content.length / estimatedCharsPerLine);
        return estimatedLines > maxLines;
    }
  }, [content, maxLines, estimatedCharsPerLine, contentType]);

  // Calculate display content based on expansion state
  const displayContent = useMemo(() => {
    if (isExpanded || !shouldShowExpandButton) {
      return content;
    }

    // Different truncation logic for different content types
    switch (contentType) {
      case 'terminal':
        const lines = content.split('\n');
        return lines.slice(0, 7).join('\n') + (lines.length > 7 ? '\n...' : '');
        
      case 'tool':
        return content.length > 200 
          ? content.substring(0, 200) + '...'
          : content;
          
      case 'reasoning':
        return content.length > 400 
          ? content.substring(0, 400) + '...'
          : content;
          
      case 'text':
      default:
        const maxChars = maxLines * estimatedCharsPerLine;
        return content.length > maxChars 
          ? content.substring(0, maxChars) + '...'
          : content;
    }
  }, [content, isExpanded, shouldShowExpandButton, maxLines, estimatedCharsPerLine, contentType]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const setExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  return {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
    setExpanded,
  };
}