import { sessionCreate, sessionShell, sessionDelete } from '../api/sdk.gen';
import { Client } from '../api/client';


// Constants
const DEFAULT_AGENT = 'build';
const SESSION_TITLE_MAX_LENGTH = 30;

// Types
interface MessagePart {
  type: string;
  text?: string;
  tool?: string;
  state?: {
    status: string;
    metadata?: {
      output?: string;
    };
  };
}





// Utility functions
function createSessionTitle(command: string): string {
  const truncated = command.length > SESSION_TITLE_MAX_LENGTH 
    ? `${command.substring(0, SESSION_TITLE_MAX_LENGTH)}...` 
    : command;
  return `Temporary session for command: ${truncated}`;
}





function extractTextFromParts(parts: MessagePart[]): string {
  // First try to extract from tool parts (like bash commands)
  const toolOutputs = parts
    .filter(part => part.type === 'tool' && part.state?.status === 'completed')
    .map(part => part.state?.metadata?.output || '')
    .filter(output => output.trim().length > 0);
  
  if (toolOutputs.length > 0) {
    return toolOutputs.join('').trim();
  }
  
  // Fallback to text parts
  return parts
    .filter(part => part.type === 'text')
    .map(part => part.text || '')
    .join('')
    .trim();
}

async function createSession(client: Client, command: string) {
  const response = await sessionCreate({
    client,
    body: { title: createSessionTitle(command) }
  });
  
  if (!response.data) {
    throw new Error(`Failed to create session for command: ${command}`);
  }
  
  return response.data;
}

async function executeCommand(client: Client, sessionId: string, command: string) {
  const response = await sessionShell({
    client,
    path: { id: sessionId },
    body: {
      agent: DEFAULT_AGENT,
      command
    }
  });
  
  console.log('sessionShell response:', JSON.stringify(response.data, null, 2));
  
  if (!response.data) {
    throw new Error(`Failed to execute command: ${command}`);
  }
  
  return response.data;
}



async function cleanupSession(client: Client, sessionId: string): Promise<void> {
  try {
    await sessionDelete({
      client,
      path: { id: sessionId }
    });
  } catch (error) {
    // Session cleanup failure is not critical
    console.warn(`Failed to cleanup session ${sessionId}:`, error);
  }
}

/**
 * Runs a shell command in a temporary session and returns the output
 * 
 * @param client - The opencode client instance
 * @param shellCommand - The shell command to execute
 * @returns The output of the shell command
 */
interface SessionShellMessage {
  info: {
    id: string;
    sessionID: string;
    role: string;
    time: {
      created: number;
      completed?: number;
    };
    system: string[];
    mode: string;
    cost: number;
    path: {
      cwd: string;
      root: string;
    };
    tokens: {
      input: number;
      output: number;
      reasoning: number;
      cache: {
        read: number;
        write: number;
      };
    };
    modelID: string;
    providerID: string;
  };
  parts: MessagePart[];
}

export async function runShellCommandInSession(
  client: Client,
  shellCommand: string
): Promise<string> {
  const session = await createSession(client, shellCommand);

  try {
    const response = await executeCommand(client, session.id, shellCommand);
    // The response has both info (AssistantMessage) and parts array
    const sessionMessage = response as unknown as SessionShellMessage;
    const parts = sessionMessage.parts || [];
    return extractTextFromParts(parts);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error running shell command "${shellCommand}": ${errorMessage}`);
  } finally {
    await cleanupSession(client, session.id);
  }
}