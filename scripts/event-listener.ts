#!/usr/bin/env tsx

import type { Event } from '../src/api/types.gen';
import { writeFileSync, appendFileSync, existsSync } from 'fs';

// Default server URL - can be overridden with environment variable
const SERVER_URL = process.env.OPENCODE_SERVER_URL || 'http://localhost:8080';
const DEFAULT_OUTPUT_FILE = 'events.jsonl';

interface EventListenerOptions {
  serverUrl?: string;
  headers?: Record<string, string>;
  outputFile?: string;
}

class EventListener {
  private serverUrl: string;
  private abortController: AbortController | null = null;
  private outputFile: string;
  private headers: Record<string, string>;

  constructor(options: EventListenerOptions = {}) {
    this.serverUrl = options.serverUrl || SERVER_URL;
    this.headers = options.headers || {};
    this.outputFile = options.outputFile || DEFAULT_OUTPUT_FILE;
    
    // Initialize the output file (create if doesn't exist, or append if it does)
    if (!existsSync(this.outputFile)) {
      writeFileSync(this.outputFile, '');
      console.error(`Created new events file: ${this.outputFile}`);
    } else {
      console.error(`Appending to existing events file: ${this.outputFile}`);
    }
  }

  private writeEvent(event: Event): void {
    const jsonLine = JSON.stringify(event) + '\n';
    appendFileSync(this.outputFile, jsonLine);
    console.error(`Event logged: ${event.type}`);
  }

  async start(): Promise<void> {
    console.error('Starting event listener...');
    console.error(`Connecting to: ${this.serverUrl}`);
    
    this.abortController = new AbortController();
    const eventUrl = `${this.serverUrl}/event`;

    try {
      console.error('Connecting to event stream:', eventUrl);

      const response = await fetch(eventUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.headers
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      console.error('Connected! Listening for events...');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.error('Stream ended');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Handle Server-Sent Events format
            if (trimmedLine.startsWith('data: ')) {
              const eventData = trimmedLine.substring(6);
              if (eventData === '[DONE]') {
                console.error('Received end marker');
                return;
              }
              
              try {
                const event: Event = JSON.parse(eventData);
                this.writeEvent(event);
              } catch (parseError) {
                console.error('Failed to parse event JSON:', parseError);
                console.error('Raw data:', eventData);
              }
            } else if (trimmedLine.startsWith('event: ') || 
                      trimmedLine.startsWith('id: ') || 
                      trimmedLine.startsWith('retry: ')) {
              // SSE metadata - log but don't process
              console.error('SSE metadata:', trimmedLine);
            } else {
              // Try to parse as direct JSON (in case it's not SSE format)
              try {
                const event: Event = JSON.parse(trimmedLine);
                this.writeEvent(event);
              } catch {
                console.error('Unknown line format:', trimmedLine);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Connection aborted');
      } else {
        console.error('Connection error:', error);
        process.exit(1);
      }
    }
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Handle CLI arguments
function parseArgs(): EventListenerOptions {
  const args = process.argv.slice(2);
  const options: EventListenerOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--server' || arg === '-s') {
      options.serverUrl = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.outputFile = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx scripts/event-listener.ts [options]

Options:
  --server, -s <url>    Server URL (default: http://localhost:8080)
  --output, -o <file>   Output file path (default: events.jsonl)
  --help, -h            Show this help message

Environment Variables:
  OPENCODE_SERVER_URL   Server URL (overrides default)

Examples:
  tsx scripts/event-listener.ts
  tsx scripts/event-listener.ts --server http://localhost:3000
  tsx scripts/event-listener.ts --output my-events.jsonl
  tsx scripts/event-listener.ts -s http://localhost:3000 -o events/session.jsonl
  OPENCODE_SERVER_URL=http://localhost:3000 tsx scripts/event-listener.ts
`);
      process.exit(0);
    }
  }
  
  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const listener = new EventListener(options);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.error('\nReceived SIGINT, shutting down gracefully...');
    listener.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('\nReceived SIGTERM, shutting down gracefully...');
    listener.stop();
    process.exit(0);
  });

  await listener.start();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}