import { sessionCreate, sessionShell, sessionMessage, sessionDelete } from '../api/sdk.gen';
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
    throw new Error(`Failed to create session for command: ${shellCommand}`);
  }

  try {
    console.log(`Executing shell command: ${shellCommand} in session ${session.id}`);
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
      throw new Error(`Failed to execute shell command: ${shellCommand} in session ${session.id}`);
    }

    console.log(`Shell command executed, message ID: ${message.id}`);
    
    // Wait a bit for the command to complete and generate output
    // This is a simple approach - in a production app, we might want to use events
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the message parts to extract the output
    const messageResponse = await sessionMessage({
      client,
      path: {
        id: session.id,
        messageID: message.id
      }
    });

    if (!messageResponse.data) {
      throw new Error(`Failed to retrieve message output for command: ${shellCommand} in session ${session.id}, message ${message.id}`);
    }

    console.log(`Message parts count: ${messageResponse.data.parts.length}`);
    // Extract text from text parts
    let output = '';
    for (const part of messageResponse.data.parts) {
      console.log(`Part type: ${part.type}`);
      if (part.type === 'text') {
        console.log(`Text part content: ${part.text}`);
        output += part.text;
      }
    }

    console.log(`Final output for command "${shellCommand}": "${output.trim()}"`);
    return output.trim();
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Error running shell command "${shellCommand}" in session ${session.id}: ${error.message}`);
    }
    throw new Error(`Unknown error running shell command "${shellCommand}" in session ${session.id}`);
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
      console.warn(`Failed to delete session ${session.id} after running command "${shellCommand}":`, error);
    }
  }
}