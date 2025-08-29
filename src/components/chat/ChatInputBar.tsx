import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImageAwareTextInput } from './ImageAwareTextInput';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';
import type { Command } from '../../api/types.gen';
import type { CommandSuggestion } from '../../utils/commandMentions';
import type { BuiltInCommand } from '../../types/commands';

interface ChatInputBarProps {
  inputText: string;
  onTextChange: (text: string) => void;
  selectedImages: string[];
  onImageSelected: (uri: string) => void;
  onSend: () => void;
  onInterrupt: () => void;
  isGenerating: boolean;
  isSending: boolean;
  onCommandSelect: (command: CommandSuggestion) => void;
  onMenuCommandSelect: (command: BuiltInCommand | Command) => void;
  userCommands: Command[];
  disabled?: boolean;
}

export function ChatInputBar({
  inputText,
  onTextChange,
  selectedImages,
  onImageSelected,
  onSend,
  onInterrupt,
  isGenerating,
  isSending,
  onCommandSelect,
  onMenuCommandSelect,
  userCommands,
  disabled,
}: ChatInputBarProps) {
  return (
    <View style={styles.inputContainer}>
      <ImageAwareTextInput
        style={styles.textInput}
        value={inputText}
        onChangeText={onTextChange}
        onImageSelected={onImageSelected}
        onCommandSelect={onCommandSelect}
        onMenuCommandSelect={onMenuCommandSelect}
        userCommands={userCommands}
        disabled={disabled || isSending || isGenerating}
        placeholder="Type a message..."
        placeholderTextColor="#6b7280"
        multiline
        maxLength={4000}
      />
      {isGenerating && (
        <TouchableOpacity
          style={styles.interruptButton}
          onPress={onInterrupt}
        >
          <Ionicons name="stop" size={20} color={semanticColors.textPrimary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.sendButton, ((!inputText.trim() && selectedImages.length === 0) || isSending) && styles.sendButtonDisabled]}
        onPress={() => {
          console.log('Send button pressed!', {
            hasText: !!inputText.trim(),
            imageCount: selectedImages.length,
            isSending,
            disabled: (!inputText.trim() && selectedImages.length === 0) || isSending
          });
          onSend();
        }}
        disabled={(!inputText.trim() && selectedImages.length === 0) || isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={semanticColors.background} />
        ) : (
          <Ionicons name="send" size={20} color={semanticColors.background} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderTopWidth: layout.borderWidth.DEFAULT,
    borderTopColor: semanticColors.border,
    backgroundColor: semanticColors.background,
  },
  textInput: {
    flex: 1,
    backgroundColor: semanticColors.cardBackground,
    borderRadius: layout.borderRadius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    color: semanticColors.textPrimary,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: semanticColors.textPrimary,
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: layout.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
  interruptButton: {
    backgroundColor: semanticColors.error,
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: layout.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
});