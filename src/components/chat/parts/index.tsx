import React from 'react';
import { MessagePartProps } from './MessagePart';
import { TextPart } from './TextPart';
import { ToolPart } from './ToolPart';
import { FilePart } from './FilePart';
import { ReasoningPart } from './ReasoningPart';
import { StepPart } from './StepPart';

export const PartComponentSelector: React.FC<MessagePartProps> = (props) => {
  const { part } = props;
  
  console.log('PartComponentSelector - part.type:', part.type);
  
  // Determine which component to render based on part type
  switch (part.type) {
    case 'text':
      return <TextPart {...props} />;
      
    case 'tool':
      return <ToolPart {...props} />;
      
    case 'file':
      return <FilePart {...props} />;
      
    case 'reasoning':
      return <ReasoningPart {...props} />;
      
    case 'step-start':
      return <StepPart {...props} />;
      
    default:
      // Fallback to TextPart for unknown types
      return <TextPart {...props} />;
  }
};

// Export all part components for direct use if needed
export { TextPart } from './TextPart';
export { ToolPart } from './ToolPart';
export { FilePart } from './FilePart';
export { ReasoningPart } from './ReasoningPart';
export { StepPart } from './StepPart';
export { MessagePartProps, MessagePartContainer } from './MessagePart';