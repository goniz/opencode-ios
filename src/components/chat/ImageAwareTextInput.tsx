import React from 'react';
import { 
  View, 
  StyleSheet,
  TextInputProps 
} from 'react-native';

import { SmartTextInput } from './SmartTextInput';
import { CommandMenuButton } from './CommandMenuButton';
import { AttachMenu } from './AttachMenu';
import type { CommandSuggestion } from '../../utils/commandMentions';
import type { Command } from '../../api/types.gen';
import type { BuiltInCommand } from '../../types/commands';
import type { FilePartLike } from '../../integrations/github/GitHubTypes';

interface ImageAwareTextInputProps extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange'> {
  value: string;
  onChangeText: (text: string) => void;
  onImageSelected?: (imageUri: string) => void;
  onFileAttached?: (filePart: FilePartLike) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  onCommandSelect?: (command: CommandSuggestion) => void;
  onMenuCommandSelect?: (command: BuiltInCommand | Command) => void;
  userCommands?: Command[];
  disabled?: boolean;
  disableAttachments?: boolean;
}

export function ImageAwareTextInput({ 
  value, 
  onChangeText, 
  onImageSelected,
  onFileAttached,
  onSelectionChange,
  onCommandSelect,
  onMenuCommandSelect,
  userCommands = [],
  disabled = false,
  disableAttachments = false,
  ...textInputProps 
}: ImageAwareTextInputProps) {

  
  return (
    <View style={styles.container}>
      <SmartTextInput
        {...textInputProps}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={onSelectionChange}
        onCommandSelect={onCommandSelect}
        style={[{ marginRight: 0 }, textInputProps.style]}
        editable={!disabled}
      />
      
      <CommandMenuButton
        onCommandSelect={onMenuCommandSelect || (() => {})}
        userCommands={userCommands}
        disabled={disabled}
      />
      
      <AttachMenu
        onImageSelected={onImageSelected}
        onFileAttached={onFileAttached}
        disabled={disableAttachments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
