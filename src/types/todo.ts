import { ToolPart, ToolState, ToolStateCompleted } from '../api/types.gen';

export interface Todo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

export type TodoWriteToolInput = {
  todos: Todo[];
};

export type TodoWriteStateCompleted = Omit<ToolStateCompleted, 'input'> & {
  input: TodoWriteToolInput;
};

export type TodoWriteToolPart = Omit<ToolPart, 'state'> & {
  tool: 'todowrite';
  state: ToolState | TodoWriteStateCompleted;
};