---
name: mcp-protocol
description: MCP JSON-RPC 2.0 protocol reference for tool definitions and responses
user-invocable: false
---

# MCP Protocol Reference

## Overview

MCP (Model Context Protocol) uses JSON-RPC 2.0 over HTTP.

- **Endpoint**: `POST /mcp`
- **Auth**: `Authorization: Bearer n2f_xxx`
- **Content-Type**: `application/json`

## Standard Methods

### tools/list
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "list_workflows",
        "description": "List all workflows",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    ]
  },
  "id": 1
}
```

### tools/call
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_workflows",
    "arguments": {}
  },
  "id": 2
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 5 workflows..."
      }
    ]
  },
  "id": 2
}
```

## Tool Definition Schema

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required: string[];
  };
}
```

## Available Tools (31 total)

### Workflow Tools
- `list_workflows` — List all workflows
- `get_workflow` — Get workflow by ID
- `create_workflow` — Create new workflow
- `update_workflow` — Update existing workflow
- `delete_workflow` — Delete workflow
- `activate_workflow` — Activate workflow
- `deactivate_workflow` — Deactivate workflow

### Execution Tools
- `list_executions` — List workflow executions
- `get_execution` — Get execution details
- `delete_execution` — Delete execution

### Credential Tools
- `list_credentials` — List all credentials
- `get_credential_schema` — Get credential type schema
- `create_credential` — Create credential
- `delete_credential` — Delete credential

### Tag Tools
- `list_tags` — List all tags
- `create_tag` — Create new tag
- `update_tag` — Update tag
- `delete_tag` — Delete tag
- `get_workflow_tags` — Get tags for workflow
- `update_workflow_tags` — Update workflow tags

### User Tools (Enterprise)
- `list_users` — List all users
- `get_user` — Get user by ID
- `create_user` — Create user
- `delete_user` — Delete user

### Variable Tools
- `list_variables` — List all variables
- `create_variable` — Create variable
- `delete_variable` — Delete variable

### Project Tools
- `list_projects` — List all projects
- `create_project` — Create project
- `delete_project` — Delete project

### Audit Tools
- `get_audit_events` — Get audit logs (Enterprise)

## Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

## Content Types

```typescript
type Content =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: { uri: string; text: string } };
```

## Implementation Pattern

```typescript
// Tool handler
async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  n8nClient: N8nClient
): Promise<{ content: Content[] }> {
  switch (name) {
    case 'list_workflows':
      const workflows = await n8nClient.listWorkflows();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(workflows, null, 2)
        }]
      };
    // ... other tools
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```
