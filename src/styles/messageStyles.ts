import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const MessageStyles = StyleSheet.create({
  // User message styles (bubble mode)
  userBubbleContainer: {
    backgroundColor: colors.primary[600],
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
    alignSelf: 'flex-end',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 1,
  },
  
  userBubbleText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  
  userFileContainer: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 12,
    maxWidth: '80%',
    alignSelf: 'flex-end',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexGrow: 1,
  },
  
  // Assistant message styles (expanded mode)
  expandedContainer: {
    flex: 1,
    paddingLeft: 6,
  },
  
  assistantText: {
    color: colors.gray[200],
    fontSize: 16,
    lineHeight: 22,
  },
  
  assistantFileContainer: {
    // Keep existing assistant file styling
    flex: 1,
    paddingLeft: 6,
  },
  
  // Layout styles
  userMessageRow: {
    alignItems: 'flex-end',
    marginBottom: 2,
    minHeight: 0,
    flexShrink: 1,
    alignSelf: 'flex-end',
    width: '100%',
  },
  
  assistantMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  
  // Content container styles
  userContentContainer: {
    // User message styles (bubble mode) - no flex: 1 to prevent huge bubbles
    flexShrink: 1,
    alignSelf: 'flex-end',
  },
  
  assistantContentContainer: {
    // Assistant message styles (expanded mode)
    flex: 1,
    paddingLeft: 6,
  },
  
  userContentColumn: {
    flex: 1,
    paddingLeft: 0,
    alignItems: 'flex-end',
  },
  
  assistantContentColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  
  // Message container
  messageContainer: {
    marginBottom: 16,
  },
  
  twoColumnLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  
  userMessageContainer: {
    backgroundColor: 'transparent',
  },
  
  // Special state styles
  errorContainer: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
  },
  
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  errorIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  
  errorTitle: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  
  errorMessage: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  
  queuedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  queuedText: {
    color: '#9ca3af',
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  
  streamingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  streamingText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  
  // Tool and content styles
  toolContainer: {
    backgroundColor: '#0f1419',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  
  toolHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  
  toolTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  
  toolOutput: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#9ca3af',
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  
  toolError: {
    fontSize: 14,
    color: '#ef4444',
    backgroundColor: '#1f1416',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  
  reasoningContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  
  reasoningLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
    fontStyle: 'italic',
  },
  
  fileContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  
  fileText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  
  stepText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  
  agentText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});