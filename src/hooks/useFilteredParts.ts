import { useMemo } from 'react';
import type { Part } from '../api/types.gen';
import { filterMessageParts, categorizeMessageParts } from '../utils/messageFiltering';

/**
 * Hook to filter message parts based on web implementation logic
 * Returns filtered parts and metadata about the filtering
 */
export function useFilteredParts(parts: Part[]) {
  return useMemo(() => {
    const filtered = filterMessageParts(parts);
    const categorized = categorizeMessageParts(parts);
    
    return {
      filteredParts: filtered,
      originalParts: parts,
      ...categorized
    };
  }, [parts]);
}

/**
 * Hook specifically for checking if a message has any visible content
 */
export function useHasVisibleContent(parts: Part[]): boolean {
  return useMemo(() => {
    const filtered = filterMessageParts(parts);
    return filtered.length > 0;
  }, [parts]);
}