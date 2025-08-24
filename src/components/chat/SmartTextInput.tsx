import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TextInputProps 
} from 'react-native';
import { useConnection } from '../../contexts/ConnectionContext';
import { FileSuggestions } from './FileSuggestions';
import { CommandSuggestions } from './CommandSuggestions';
import { 
  searchFiles, 
  getCurrentFileMention, 
  replaceFileMention,
  formatFileSuggestions,
  type FileSuggestion 
} from '../../utils/fileMentions';
import {
  getCurrentCommandMention,
  replaceCommandMention,
  searchCommands,
  formatCommandSuggestions,
  type CommandSuggestion
} from '../../utils/commandMentions';

interface SmartTextInputProps extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange'> {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  onCommandSelect?: (command: CommandSuggestion) => void;
}

export function SmartTextInput({ 
  value, 
  onChangeText, 
  onSelectionChange,
  onCommandSelect,
  ...textInputProps 
}: SmartTextInputProps) {
  const { client, commands } = useConnection();
  
  // File suggestions state
  const [fileSuggestions, setFileSuggestions] = useState<FileSuggestion[]>([]);
  const [showFileSuggestions, setShowFileSuggestions] = useState(false);
  const [currentFileMention, setCurrentFileMention] = useState<{ start: number; end: number; query: string } | null>(null);
  
  // Command suggestions state
  const [commandSuggestions, setCommandSuggestions] = useState<CommandSuggestion[]>([]);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [currentCommandMention, setCurrentCommandMention] = useState<{ start: number; end: number; query: string } | null>(null);
  
  const [cursorPosition, setCursorPosition] = useState(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
    
    // Clear previous search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    console.log('Text changed:', { text, cursorPosition, textLength: text.length });
    
    // Check for file mentions using current cursor position
    const fileMention = getCurrentFileMention(text, cursorPosition);
    setCurrentFileMention(fileMention);
    
    // Check for command mentions using current cursor position
    const commandMention = getCurrentCommandMention(text, cursorPosition);
    setCurrentCommandMention(commandMention);
    
    console.log('Mentions detected:', { fileMention, commandMention });
    
    // Handle file mention search
    if (fileMention && fileMention.query.length > 0) {
      // Hide command suggestions when typing file mention
      setShowCommandSuggestions(false);
      setCommandSuggestions([]);
      
      searchTimeoutRef.current = setTimeout(async () => {
        if (client) {
          try {
            const results = await searchFiles(fileMention.query, client);
            const formatted = formatFileSuggestions(results);
            setFileSuggestions(formatted);
            setShowFileSuggestions(formatted.length > 0);
          } catch (error) {
            console.error('Error searching files:', error);
            setFileSuggestions([]);
            setShowFileSuggestions(false);
          }
        }
      }, 300);
    } else {
      setFileSuggestions([]);
      setShowFileSuggestions(false);
    }
    
    // Handle command mention search
    if (commandMention) {
      // Hide file suggestions when typing command mention
      setShowFileSuggestions(false);
      setFileSuggestions([]);
      
      console.log('Command mention detected:', commandMention, 'Available commands:', commands.length);
      
      const results = searchCommands(commandMention.query, commands);
      const formatted = formatCommandSuggestions(results);
      
      console.log('Command search results:', results.length, 'formatted:', formatted.length);
      
      setCommandSuggestions(formatted);
      setShowCommandSuggestions(formatted.length > 0);
    } else if (!fileMention && text.endsWith('/')) {
      // Special case: show all commands when user just types "/"
      console.log('User typed /, showing all commands');
      const results = searchCommands('', commands); // Empty query shows all commands
      const formatted = formatCommandSuggestions(results);
      
      console.log('All commands results:', results.length, 'formatted:', formatted.length);
      
      setCommandSuggestions(formatted);
      setShowCommandSuggestions(formatted.length > 0);
    } else if (!fileMention) {
      // Only hide command suggestions if we're not in a file mention
      setCommandSuggestions([]);
      setShowCommandSuggestions(false);
    }
  }, [onChangeText, cursorPosition, client, commands]);

  const handleSelectionChange = useCallback((event: { nativeEvent: { selection: { start: number; end: number } } }) => {
    const { start, end } = event.nativeEvent.selection;
    setCursorPosition(start);
    
    if (onSelectionChange) {
      onSelectionChange({ start, end });
    }
    
    // Check if cursor moved out of file mention
    if (currentFileMention) {
      const mention = getCurrentFileMention(value, start);
      if (!mention) {
        setCurrentFileMention(null);
        setFileSuggestions([]);
        setShowFileSuggestions(false);
      }
    }
    
    // Check if cursor moved out of command mention
    if (currentCommandMention) {
      const mention = getCurrentCommandMention(value, start);
      if (!mention) {
        setCurrentCommandMention(null);
        setCommandSuggestions([]);
        setShowCommandSuggestions(false);
      }
    }
  }, [onSelectionChange, value, currentFileMention, currentCommandMention]);

  const handleSelectFile = useCallback((filePath: string) => {
    if (currentFileMention) {
      const newText = replaceFileMention(value, currentFileMention, filePath);
      onChangeText(newText);
      
      // Clear suggestions
      setFileSuggestions([]);
      setShowFileSuggestions(false);
      setCurrentFileMention(null);
    }
  }, [value, currentFileMention, onChangeText]);
  
const handleSelectCommand = useCallback((commandName: string) => {
    const selectedCommand = commands.find(cmd => cmd.name === commandName);
    if (!selectedCommand) return;
    
    let newText = '';
    
    // Check if the template contains $ARGUMENTS
    if (selectedCommand.template && selectedCommand.template.includes('$ARGUMENTS')) {
      // Inject the command into the input box with a space but don't send
      const commandText = `/${commandName} `;
      if (currentCommandMention) {
        newText = replaceCommandMention(value, currentCommandMention, commandText);
      } else {
        // If no current mention, just append to the end
        newText = value + commandText;
      }
    } else {
      // For commands without $ARGUMENTS, inject the command
      const commandText = `/${commandName}`;
      if (currentCommandMention) {
        newText = replaceCommandMention(value, currentCommandMention, commandText);
      } else {
        // If no current mention, just append to the end
        newText = value + commandText;
      }
    }
    
    // Update the text
    onChangeText(newText);
    
    // If there's an onCommandSelect callback, call it
    if (onCommandSelect) {
      onCommandSelect({
        name: selectedCommand.name,
        description: selectedCommand.description,
        agent: selectedCommand.agent,
        model: selectedCommand.model,
        template: selectedCommand.template
      });
    }
    
    // Clear suggestions
    setCommandSuggestions([]);
    setShowCommandSuggestions(false);
    setCurrentCommandMention(null);
  }, [value, currentCommandMention, onChangeText, commands, onCommandSelect]);

  const handleCloseFileSuggestions = useCallback(() => {
    setFileSuggestions([]);
    setShowFileSuggestions(false);
  }, []);
  
  const handleCloseCommandSuggestions = useCallback(() => {
    setCommandSuggestions([]);
    setShowCommandSuggestions(false);
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
        suggestions={fileSuggestions}
        visible={showFileSuggestions}
        onSelectFile={handleSelectFile}
        onClose={handleCloseFileSuggestions}
      />
      
      <CommandSuggestions
        suggestions={commandSuggestions}
        visible={showCommandSuggestions}
        onSelectCommand={handleSelectCommand}
        onClose={handleCloseCommandSuggestions}
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