import { sessionCreate, sessionShell, sessionMessage, sessionDelete, sessionMessages } from '../api/sdk.gen';
import { Client } from '../api/client';
import { withRetry, delay } from './retryUtils';

// Constants
const DEFAULT_AGENT = 'general';
const COMMAND_COMPLETION_DELAY = 1000;
const SESSION_TITLE_MAX_LENGTH = 30;

// Types
interface MessagePart {
  type: string;
  text?: string;
}

interface MessageData {
  parts: MessagePart[];
}

interface SessionMessage {
  info: {
    id: string;
    role: string;
    time: {
      created?: number;
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



async function resolveMessageId(
  client: Client, 
  sessionId: string, 
  messageId: string
): Promise<string> {
  if (!messageId.includes('{messageID}')) {
    return messageId;
  }
  
  const messagesResponse = await sessionMessages({
    client,
    path: { id: sessionId }
  });
  
  if (!messagesResponse.data?.length) {
    throw new Error('No messages found in session');
  }
  
  const assistantMessages = messagesResponse.data
    .filter((m: SessionMessage) => m.info.role === 'assistant')
    .sort((a: SessionMessage, b: SessionMessage) => 
      (b.info.time.created || 0) - (a.info.time.created || 0));
  
  if (!assistantMessages.length) {
    throw new Error('No assistant messages found in session');
  }
  
  return assistantMessages[0].info.id;
}

function extractTextFromParts(parts: MessagePart[]): string {
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
  
  if (!response.data) {
    throw new Error(`Failed to execute command: ${command}`);
  }
  
  return response.data;
}

async function fetchMessage(client: Client, sessionId: string, messageId: string): Promise<MessageData> {
  return withRetry(async () => {
    const result = await sessionMessage({
      client,
      path: {
        id: sessionId,
        messageID: messageId
      }
    });

    if (!result.data) {
      throw new Error('Message data not available');
    }

    return result.data;
  });
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
export async function runShellCommandInSession(
  client: Client,
  shellCommand: string
): Promise<string> {
  const session = await createSession(client, shellCommand);
  
  try {
    const message = await executeCommand(client, session.id, shellCommand);
    const actualMessageId = await resolveMessageId(client, session.id, message.id);
    
    await delay(COMMAND_COMPLETION_DELAY);
    
    const messageData = await fetchMessage(client, session.id, actualMessageId);
    return extractTextFromParts(messageData.parts);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error running shell command "${shellCommand}": ${errorMessage}`);
  } finally {
    await cleanupSession(client, session.id);
  }
}