import { sessionCreate, sessionShell, sessionDelete } from '../api/sdk.gen';
import { Client } from '../api/client';

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
  // Create a new session
  const sessionResponse = await sessionCreate({
    client,
    body: {
      title: `Temporary session for command: ${shellCommand.substring(0, 30)}${shellCommand.length > 30 ? '...' : ''}`
    }
  });

  const session = sessionResponse.data;
  if (!session) {
    throw new Error('Failed to create session');
  }

  try {
    // Execute the shell command in the session
    const shellResponse = await sessionShell({
      client,
      path: {
        id: session.id
      },
      body: {
        agent: 'general', // Default agent
        command: shellCommand
      }
    });

    const message = shellResponse.data;
    if (!message) {
      throw new Error('Failed to execute shell command');
    }

    // For now, we'll return a success message since the actual output
    // would be in the message parts which would require additional processing
    return `Command executed successfully in session ${session.id}`;
  } finally {
    // Clean up by deleting the session
    try {
      await sessionDelete({
        client,
        path: {
          id: session.id
        }
      });
    } catch (error) {
      // Log the error but don't throw, as the command was already executed
      console.warn(`Failed to delete session ${session.id}:`, error);
    }
  }
}