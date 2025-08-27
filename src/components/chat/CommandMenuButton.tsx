import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Command } from '../../api/types.gen';
import type { BuiltInCommand } from '../../types/commands';
import { BUILT_IN_COMMANDS } from '../../types/commands';

interface CommandMenuButtonProps {
  onCommandSelect: (command: BuiltInCommand | Command) => void;
  userCommands?: Command[];
  disabled?: boolean;
}

export function CommandMenuButton({ onCommandSelect, userCommands = [], disabled = false }: CommandMenuButtonProps) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleOpenMenu = useCallback(() => {
    if (!disabled) {
      setIsMenuVisible(true);
    }
  }, [disabled]);

  const handleCloseMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const handleCommandSelect = useCallback((command: BuiltInCommand | Command) => {
    setIsMenuVisible(false);
    onCommandSelect(command);
  }, [onCommandSelect]);

  const renderBuiltInCommand = useCallback(({ item }: { item: BuiltInCommand }) => (
    <TouchableOpacity
      style={styles.commandItem}
      onPress={() => handleCommandSelect(item)}
    >
      <View style={styles.commandContent}>
        <Text style={styles.commandName}>/{item.name}</Text>
        <Text style={styles.commandDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#6b7280" />
    </TouchableOpacity>
  ), [handleCommandSelect]);

  const renderUserCommand = useCallback(({ item }: { item: Command }) => (
    <TouchableOpacity
      style={styles.commandItem}
      onPress={() => handleCommandSelect(item)}
    >
      <View style={styles.commandContent}>
        <Text style={styles.commandName}>/{item.name}</Text>
        {item.description && (
          <Text style={styles.commandDescription}>{item.description}</Text>
        )}
        {item.agent && (
          <Text style={styles.commandMeta}>Agent: {item.agent}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#6b7280" />
    </TouchableOpacity>
  ), [handleCommandSelect]);

  const renderSectionHeader = useCallback(({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  ), []);

  return (
    <>
      <TouchableOpacity
        style={[styles.menuButton, disabled && styles.menuButtonDisabled]}
        onPress={handleOpenMenu}
        disabled={disabled}
        testID="command-menu-button"
      >
        <Ionicons 
          name="menu" 
          size={20} 
          color={disabled ? "#6b7280" : "#ffffff"} 
        />
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseMenu}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Commands</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseMenu}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <FlatList
            style={styles.commandList}
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={() => (
              <View>
                {/* Built-in Commands Section */}
                {renderSectionHeader({ title: 'Built-in Commands' })}
                <FlatList
                  data={BUILT_IN_COMMANDS}
                  renderItem={renderBuiltInCommand}
                  keyExtractor={(item) => item.name}
                  scrollEnabled={false}
                />

                {/* User Commands Section */}
                {userCommands.length > 0 && (
                  <>
                    {renderSectionHeader({ title: 'User-Added Commands' })}
                    <FlatList
                      data={userCommands}
                      renderItem={renderUserCommand}
                      keyExtractor={(item) => item.name}
                      scrollEnabled={false}
                    />
                  </>
                )}
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    backgroundColor: '#2a2a2a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  menuButtonDisabled: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  commandList: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0f0f0f',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  commandContent: {
    flex: 1,
  },
  commandName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  commandDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  commandMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
