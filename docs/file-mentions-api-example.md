```typescript
import type {
  SessionChatData,
  SessionChatResponse,
  TextPartInput,
  FilePartInput,
  FileSource,
  FilePartSourceText,
  AgentPartInput,
} from "@packages/sdk/js/src/gen/types.gen.ts"

// Example function to send a chat message with a file mention
async function sendChatMessage(
  sessionID: string,
  providerID: string,
  modelID: string,
  message: string,
  filePath?: string,
  fileContent?: string,
): Promise<SessionChatResponse> {
  const parts: SessionChatData["body"]["parts"] = [
    {
      type: "text",
      text: message,
    },
  ]

  // Add file mention if provided
  if (filePath && fileContent) {
    const fileSource: FileSource = {
      type: "file",
      path: filePath,
      text: {
        value: fileContent,
        start: 0,
        end: fileContent.length,
      },
    }

    const filePart: FilePartInput = {
      type: "file",
      mime: "text/plain",
      filename: filePath.split("/").pop(),
      url: `file://${filePath}`,
      source: fileSource,
    }

    parts.push(filePart)
  }

  const chatData: SessionChatData = {
    body: {
      providerID,
      modelID,
      parts,
    },
    path: {
      id: sessionID,
    },
    query: undefined,
    url: `/session/${sessionID}/message`,
  }

  const response = await fetch(`http://localhost:3000/session/${sessionID}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chatData.body),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Usage example
const result = await sendChatMessage(
  "session-123",
  "anthropic",
  "claude-3-5-sonnet-20241022",
  "Please review this code and suggest improvements",
  "/path/to/file.ts",
  "const x = 42;", // file content
)

// The result will be fully typed with:
// - info: AssistantMessage
// - parts: Array<Part>
console.log(result.info.role) // "assistant"
console.log(result.parts[0].type) // "text" | "file" | etc.
```
