import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TextInputProps 
} from 'react-native';
import { useConnection } from '../../contexts/ConnectionContext';
import { FileSuggestions } from './FileSuggestions';
import { 
  searchFiles, 
  getCurrentFileMention, 
  replaceFileMention,
  formatFileSuggestions,
  type FileSuggestion 
} from '../../utils/fileMentions';

interface FileAwareTextInputProps extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange'> {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
}

export function FileAwareTextInput({ 
  value, 
  onChangeText, 
  onSelectionChange,
  ...textInputProps 
}: FileAwareTextInputProps) {
  const { client } = useConnection();
  const [suggestions, setSuggestions] = useState<FileSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentMention, setCurrentMention] = useState<{ start: number; end: number; query: string } | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
    
    // Check if we're in a file mention
    const mention = getCurrentFileMention(text, cursorPosition);
    setCurrentMention(mention);
    
    if (mention && mention.query.length > 0) {
      // Clear previous search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Debounce the search
      searchTimeoutRef.current = setTimeout(async () => {
        if (client) {
          try {
            const results = await searchFiles(mention.query, client);
            const formatted = formatFileSuggestions(results);
            setSuggestions(formatted);
            setShowSuggestions(formatted.length > 0);
          } catch (error) {
            console.error('Error searching files:', error);
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [onChangeText, cursorPosition, client]);

  const handleSelectionChange = useCallback((event: { nativeEvent: { selection: { start: number; end: number } } }) => {
    const { start, end } = event.nativeEvent.selection;
    setCursorPosition(start);
    
    if (onSelectionChange) {
      onSelectionChange({ start, end });
    }
    
    // Check if cursor moved out of mention
    if (currentMention) {
      const mention = getCurrentFileMention(value, start);
      if (!mention) {
        setCurrentMention(null);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  }, [onSelectionChange, value, currentMention]);

  const handleSelectFile = useCallback((filePath: string) => {
    if (currentMention) {
      const newText = replaceFileMention(value, currentMention, filePath);
      onChangeText(newText);
      
      // Clear suggestions
      setSuggestions([]);
      setShowSuggestions(false);
      setCurrentMention(null);
    }
  }, [value, currentMention, onChangeText]);

  const handleCloseSuggestions = useCallback(() => {
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <FileSuggestions
        suggestions={suggestions}
        visible={showSuggestions}
        onSelectFile={handleSelectFile}
        onClose={handleCloseSuggestions}
      />
      
      <TextInput
        {...textInputProps}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        style={[styles.textInput, textInputProps.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
  },
});