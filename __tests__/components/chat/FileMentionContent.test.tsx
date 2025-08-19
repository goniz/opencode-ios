import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FileMentionContent } from '../../../src/components/chat/content/FileMentionContent';

describe('FileMentionContent', () => {
  it('should render regular text without mentions', () => {
    const { getByText } = render(
      <FileMentionContent content="This is regular text" />
    );
    
    expect(getByText('This is regular text')).toBeTruthy();
  });

  it('should render file mentions as styled components', () => {
    const { getByText } = render(
      <FileMentionContent content="Check @src/utils/helper.ts for details" />
    );
    
    expect(getByText('Check')).toBeTruthy();
    expect(getByText('helper.ts')).toBeTruthy();
    expect(getByText('for details')).toBeTruthy();
  });

  it('should call onFileMentionPress when mention is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <FileMentionContent 
        content="Check @src/utils/helper.ts" 
        onFileMentionPress={mockOnPress}
      />
    );
    
    const mention = getByText('helper.ts');
    fireEvent.press(mention);
    
    expect(mockOnPress).toHaveBeenCalledWith('src/utils/helper.ts');
  });

  it('should handle multiple file mentions', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <FileMentionContent 
        content="Files @app.tsx and @components/Button.tsx need updates"
        onFileMentionPress={mockOnPress}
      />
    );
    
    const firstMention = getByText('app.tsx');
    const secondMention = getByText('Button.tsx');
    
    fireEvent.press(firstMention);
    expect(mockOnPress).toHaveBeenCalledWith('app.tsx');
    
    fireEvent.press(secondMention);
    expect(mockOnPress).toHaveBeenCalledWith('components/Button.tsx');
  });
});