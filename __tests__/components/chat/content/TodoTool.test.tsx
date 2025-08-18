import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TodoTool } from '../../../../src/components/chat/content/TodoTool';
import { Todo } from '../../../../src/api/types.gen';

const mockTodos: Todo[] = [
  { id: '1', content: 'First todo', status: 'completed', priority: 'high' },
  { id: '2', content: 'Second todo', status: 'in_progress', priority: 'medium' },
  { id: '3', content: 'Third todo', status: 'pending', priority: 'low' },
];

describe('TodoTool', () => {
  it('renders the correct title for mixed status todos', () => {
    render(<TodoTool todos={mockTodos} />);
    expect(screen.getByText('Updating plan')).toBeTruthy();
  });

  it('renders the correct title for all pending todos', () => {
    const pendingTodos: Todo[] = mockTodos.map(t => ({ ...t, status: 'pending' }));
    render(<TodoTool todos={pendingTodos} />);
    expect(screen.getByText('Creating plan')).toBeTruthy();
  });

  it('renders the correct title for all completed todos', () => {
    const completedTodos: Todo[] = mockTodos.map(t => ({ ...t, status: 'completed' }));
    render(<TodoTool todos={completedTodos} />);
    expect(screen.getByText('Completing plan')).toBeTruthy();
  });

  it('renders all todo items', () => {
    render(<TodoTool todos={mockTodos} />);
    expect(screen.getByText('First todo')).toBeTruthy();
    expect(screen.getByText('Second todo')).toBeTruthy();
    expect(screen.getByText('Third todo')).toBeTruthy();
  });
});
