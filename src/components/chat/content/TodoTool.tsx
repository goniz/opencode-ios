import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Todo } from '../../../api/types.gen';

interface TodoToolProps {
  todos: Todo[];
}

const getTitle = (todos: Todo[]) => {
  const allPending = todos.every(t => t.status === 'pending');
  const allCompleted = todos.every(t => t.status === 'completed');

  if (allPending) {
    return 'Creating plan';
  }
  if (allCompleted) {
    return 'Completing plan';
  }
  return 'Updating plan';
};

export const TodoTool: React.FC<TodoToolProps> = ({ todos }) => {
  const title = getTitle(todos);

  const sortedTodos = [...todos].sort((a, b) => {
    const priority = {
      in_progress: 0,
      pending: 1,
      completed: 2,
    };
    return priority[a.status] - priority[b.status];
  });

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem} key={item.id}>
      <View style={[styles.statusIndicator, styles[item.status]]} />
      <Text style={styles.todoContent}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={sortedTodos}
        renderItem={renderTodoItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pending: {
    backgroundColor: '#6b7280', // gray-500
  },
  in_progress: {
    backgroundColor: '#3b82f6', // blue-500
  },
  completed: {
    backgroundColor: '#10b981', // green-500
  },
  todoContent: {
    color: '#ffffff',
  },
});
