import { sessionCreate, sessionShell, sessionDelete, sessionList } from '../api/sdk.gen';
import { Client } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const DEFAULT_AGENT = 'build';
const SHELL_SESSION_TITLE = 'OpenCodeMobile-Shell';
const STORAGE_KEY_SHELL_SESSION = 'shell_session_id';

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
async function getCachedSessionId(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_SHELL_SESSION);
    return stored;
  } catch (error) {
    console.warn('Failed to read cached session ID from storage:', error);
    return null;
  }
}

async function setCachedSessionId(sessionId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SHELL_SESSION, sessionId);
  } catch (error) {
    console.warn('Failed to cache session ID to storage:', error);
  }
}

async function clearCachedSessionId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_SHELL_SESSION);
  } catch (error) {
    console.warn('Failed to clear cached session ID from storage:', error);
  }
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

async function findExistingShellSession(client: Client): Promise<string | null> {
  try {
    const response = await sessionList({ client });
    
    if (!response.data) {
      return null;
    }
    
    const shellSession = response.data.find(session => 
      session.title === SHELL_SESSION_TITLE
    );
    
    return shellSession?.id || null;
  } catch (error) {
    console.warn('Failed to list sessions:', error);
    return null;
  }
}

async function createShellSession(client: Client): Promise<{ id: string }> {
  const response = await sessionCreate({
    client,
    body: { title: SHELL_SESSION_TITLE }
  });
  
  if (!response.data) {
    throw new Error('Failed to create dedicated shell session');
  }
  
  return response.data;
}

async function getOrCreateShellSession(client: Client): Promise<string> {
  let sessionId = await getCachedSessionId();
  
  // Validate cached session exists by checking if it exists in the session list
  if (sessionId) {
    try {
      const response = await sessionList({ client });
      const sessionExists = response.data?.some(session => session.id === sessionId);
      
      if (sessionExists) {
        return sessionId;
      } else {
        console.warn('Cached session not found in session list, clearing cache');
        await clearCachedSessionId();
        sessionId = null;
      }
    } catch (error) {
      console.warn('Failed to validate cached session, clearing cache:', error);
      await clearCachedSessionId();
      sessionId = null;
    }
  }
  
  // Look for existing shell session
  if (!sessionId) {
    sessionId = await findExistingShellSession(client);
  }
  
  // Create new session if none found
  if (!sessionId) {
    const session = await createShellSession(client);
    sessionId = session.id;
  }
  
  // Cache the session ID
  await setCachedSessionId(sessionId);
  
  return sessionId;
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



/**
 * Manually clean up the persistent shell session (optional - for maintenance)
 */
export async function cleanupShellSession(client: Client): Promise<void> {
  const sessionId = await getCachedSessionId();
  if (!sessionId) {
    return;
  }
  
  try {
    await sessionDelete({
      client,
      path: { id: sessionId }
    });
    await clearCachedSessionId();
    console.log('Shell session cleaned up successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('Shell session already deleted');
      await clearCachedSessionId();
      return;
    }
    console.error('Error cleaning up shell session:', error);
    throw error;
  }
}

/**
 * Runs a shell command in a dedicated persistent session and returns the output
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

async function executeShellCommand(
  client: Client,
  shellCommand: string,
  sessionId: string
): Promise<string> {
  const response = await executeCommand(client, sessionId, shellCommand);
  const sessionMessage = response as unknown as SessionShellMessage;
  const parts = sessionMessage.parts || [];
  return extractTextFromParts(parts);
}

export async function runShellCommandInSession(
  client: Client,
  shellCommand: string
): Promise<string> {
  try {
    const sessionId = await getOrCreateShellSession(client);
    return await executeShellCommand(client, shellCommand, sessionId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If the error suggests the session is invalid, clear the cache and retry once
    if (errorMessage.includes('not found') || errorMessage.includes('invalid')) {
      try {
        await clearCachedSessionId();
        const sessionId = await getOrCreateShellSession(client);
        return await executeShellCommand(client, shellCommand, sessionId);
      } catch (retryError) {
        const retryErrorMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
        throw new Error(`Error running shell command "${shellCommand}" (retry failed): ${retryErrorMessage}`);
      }
    }

    throw new Error(`Error running shell command "${shellCommand}": ${errorMessage}`);
  }
}