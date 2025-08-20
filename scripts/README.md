# Scripts

This directory contains utility scripts for the opencode-mobile project.

## event-listener.ts

A TypeScript script that connects to the opencode server and listens for events, writing them to a file in JSONL format.

### Usage

```bash
# Run with default settings (connects to localhost:8080, writes to events.jsonl)
npm run events

# Or run directly with tsx
tsx scripts/event-listener.ts

# Connect to a different server
tsx scripts/event-listener.ts --server http://localhost:3000

# Specify custom output file
tsx scripts/event-listener.ts --output my-events.jsonl

# Combine options
tsx scripts/event-listener.ts -s http://localhost:3000 -o events/session.jsonl

# Use environment variable
OPENCODE_SERVER_URL=http://localhost:3000 npm run events

# Show help
tsx scripts/event-listener.ts --help
```

### Features

- Connects to opencode server event stream endpoint (`/event`)
- Handles Server-Sent Events (SSE) format
- Writes all events to file in JSONL format (default: `events.jsonl`)
- Creates new file or appends to existing file
- Error messages and status go to stderr
- Graceful shutdown on SIGINT/SIGTERM
- Configurable server URL and output file via CLI arguments or environment variable

### Output Format

Events are written to the specified file as JSON Lines (JSONL):
```jsonl
{"type":"session.updated","properties":{"info":{"id":"abc123",...}}}
{"type":"message.updated","properties":{"info":{"id":"msg456",...}}}
```

Each event is written as a single line with a newline separator. Status messages and errors are logged to stderr.

### Event Types

The script handles all event types defined in the OpenAPI schema:
- `installation.updated`
- `lsp.client.diagnostics` 
- `message.updated`
- `message.removed`
- `message.part.updated`
- `message.part.removed`
- `storage.write`
- `permission.updated`
- `permission.replied`
- `file.edited`
- `session.updated`
- `session.deleted`
- `session.idle`
- `session.error`
- `server.connected`
- `file.watcher.updated`
- `ide.installed`

## ota-host.ts

TypeScript-based OTA hosting solution for distributing IPA files. See main README for details.