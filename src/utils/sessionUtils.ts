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
  console.log(`Creating session for command: ${shellCommand}`);
  console.log(`SessionCreate request body:`, {
    title: `Temporary session for command: ${shellCommand.substring(0, 30)}${shellCommand.length > 30 ? '...' : ''}`
  });
  
  // Create a new session
  const sessionResponse = await sessionCreate({
    client,
    body: {
      title: `Temporary session for command: ${shellCommand.substring(0, 30)}${shellCommand.length > 30 ? '...' : ''}`
    }
  });

  console.log(`SessionCreate response:`, sessionResponse);
  const session = sessionResponse.data;
  if (!session) {
    throw new Error(`Failed to create session for command: ${shellCommand}`);
  }

  console.log(`Session created with ID: ${session.id}`);

  try {
    console.log(`Executing shell command: ${shellCommand} in session ${session.id}`);
    console.log(`SessionShell request body:`, {
      agent: 'general',
      command: shellCommand
    });
    
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

    console.log(`SessionShell response:`, shellResponse);
    const message = shellResponse.data;
    if (!message) {
      throw new Error(`Failed to execute shell command: ${shellCommand} in session ${session.id}`);
    }

    console.log(`Shell command executed, message ID: ${message.id}`);
    console.log(`Shell message response:`, message);
    
    // Validate that we have a proper message ID
    if (!message.id || message.id === 'placeholder' || message.id.startsWith('temp_')) {
      console.warn(`Suspicious message ID detected: ${message.id}`);
    }
    
    // Wait a bit for the command to complete and generate output
    // This is a simple approach - in a production app, we might want to use events
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Fetching message parts for message ${message.id} in session ${session.id}`);
    
    // Try to fetch the message multiple times in case it's not ready immediately
    let messageResponse = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        messageResponse = await sessionMessage({
          client,
          path: {
            id: session.id,
            messageID: message.id
          }
        });
        
        console.log(`SessionMessage response (attempt ${retries + 1}):`, messageResponse);
        
        if (messageResponse.data) {
          break;
        }
      } catch (error) {
        console.warn(`Failed to fetch message (attempt ${retries + 1}):`, error);
      }
      
      retries++;
      if (retries < maxRetries) {
        console.log(`Retrying message fetch in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!messageResponse || !messageResponse.data) {
      throw new Error(`Failed to retrieve message output for command: ${shellCommand} in session ${session.id}, message ${message.id} after ${maxRetries} attempts`);
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
      console.log(`Deleting session ${session.id}`);
      const deleteResponse = await sessionDelete({
        client,
        path: {
          id: session.id
        }
      });
      console.log(`SessionDelete response:`, deleteResponse);
    } catch (error) {
      // Log the error but don't throw, as the command was already executed
      console.warn(`Failed to delete session ${session.id} after running command "${shellCommand}":`, error);
    }
  }
}