import { filterMessageParts } from '../../src/utils/messageFiltering';
import { 
  createMockTextPart, 
  createMockToolPart, 
  createMockReasoningPart 
} from './testHelpers';

describe('Message Filtering Utilities', () => {
  test('filters text parts correctly', () => {
    const textPart = createMockTextPart({ text: 'Hello world' });
    const parts = [textPart];
    
    const filtered = filterMessageParts(parts);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(textPart);
  });

  test('filters tool parts correctly', () => {
    const toolPart = createMockToolPart({
      tool: 'test_tool',
      state: {
        status: 'completed',
        input: { test: 'input' },
        output: 'Tool executed successfully',
        title: 'Test Tool',
        metadata: {},
        time: { start: Date.now(), end: Date.now() + 1000 },
      },
    });
    const parts = [toolPart];
    
    const filtered = filterMessageParts(parts);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(toolPart);
  });

  test('filters reasoning parts correctly', () => {
    const reasoningPart = createMockReasoningPart({ 
      text: 'Let me think about this...' 
    });
    const parts = [reasoningPart];
    
    const filtered = filterMessageParts(parts);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(reasoningPart);
  });

  test('filters multiple parts correctly', () => {
    const textPart = createMockTextPart({ text: 'Hello' });
    const toolPart = createMockToolPart({ tool: 'test' });
    const reasoningPart = createMockReasoningPart({ text: 'Thinking...' });
    const parts = [textPart, toolPart, reasoningPart];
    
    const filtered = filterMessageParts(parts);
    
    expect(filtered).toHaveLength(3);
    expect(filtered).toContain(textPart);
    expect(filtered).toContain(toolPart);
    expect(filtered).toContain(reasoningPart);
  });

  test('handles empty parts array', () => {
    const filtered = filterMessageParts([]);
    
    expect(filtered).toHaveLength(0);
  });
});