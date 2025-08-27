import { StyleSheet } from 'react-native';
import { colors, semanticColors } from './colors';

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
     color: semanticColors.textPrimary,
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
     color: semanticColors.textSecondary,
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

  touchableContainer: {
    flex: 1,
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
     backgroundColor: '#2a1a1a', // Keep custom error background
     borderWidth: 1,
     borderColor: semanticColors.error,
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
     color: semanticColors.error,
     fontSize: 14,
     fontWeight: '600',
   },

   errorMessage: {
     color: '#fca5a5', // Keep custom error text color
     fontSize: 14,
     lineHeight: 20,
   },
  
  queuedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
   queuedText: {
     color: semanticColors.textMuted,
     fontSize: 16,
     lineHeight: 22,
     fontStyle: 'italic',
   },
  
  streamingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
   streamingText: {
     color: semanticColors.textPrimary,
     fontSize: 16,
     lineHeight: 22,
     fontStyle: 'italic',
     opacity: 0.8,
   },
  
  // Tool and content styles
   toolContainer: {
     backgroundColor: '#0f1419', // Keep custom tool background
     borderRadius: 8,
     padding: 12,
     borderWidth: 1,
     borderColor: semanticColors.border,
   },
  
   toolHeader: {
     fontSize: 14,
     fontWeight: '600',
     color: '#64748b', // Keep custom tool header color
     marginBottom: 4,
   },

   toolTitle: {
     fontSize: 14,
     fontWeight: '500',
     color: semanticColors.textSecondary,
     marginBottom: 4,
   },
  
   toolOutput: {
     fontSize: 13,
     fontFamily: 'monospace',
     color: semanticColors.textMuted,
     backgroundColor: '#000000', // Keep custom tool output background
     padding: 8,
     borderRadius: 4,
     marginTop: 4,
   },
  
   toolError: {
     fontSize: 14,
     color: semanticColors.error,
     backgroundColor: '#1f1416', // Keep custom tool error background
     padding: 8,
     borderRadius: 4,
     borderLeftWidth: 3,
     borderLeftColor: semanticColors.error,
   },
  
   reasoningContainer: {
     backgroundColor: '#1a1a2e', // Keep custom reasoning background
     borderRadius: 8,
     padding: 12,
     borderLeftWidth: 3,
     borderLeftColor: semanticColors.warning,
   },

   reasoningLabel: {
     fontSize: 12,
     fontWeight: '600',
     color: semanticColors.warning,
     textTransform: 'uppercase',
     marginBottom: 4,
   },

   reasoningText: {
     fontSize: 14,
     lineHeight: 20,
     color: '#d1d5db', // Keep custom reasoning text color
     fontStyle: 'italic',
   },
  
   fileContainer: {
     backgroundColor: '#1a1a2e', // Keep custom file background
     borderRadius: 8,
     padding: 12,
     borderLeftWidth: 3,
     borderLeftColor: semanticColors.secondary,
   },

   fileText: {
     fontSize: 14,
     color: '#d1d5db', // Keep custom file text color
   },
  
   stepText: {
     fontSize: 14,
     color: semanticColors.success,
     fontWeight: '500',
   },

   agentText: {
     fontSize: 14,
     color: semanticColors.textLink,
     fontWeight: '500',
   },
});