/**
 * MCP tool definitions for Lyzr agent integration.
 * These describe what the AI agent can call back into our system.
 */

export const MCP_TOOLS = [
  {
    name: 'list_loops',
    description: 'List all open loops for the authenticated user, optionally filtered by state.',
    inputSchema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['waiting', 'due', 'overdue', 'escalated', 'closed'],
          description: 'Filter loops by state',
        },
        limit: { type: 'number', description: 'Max results to return', default: 50 },
      },
    },
  },
  {
    name: 'get_loop',
    description: 'Get full details of a single loop by ID.',
    inputSchema: {
      type: 'object',
      required: ['loop_id'],
      properties: {
        loop_id: { type: 'string', description: 'UUID of the loop' },
      },
    },
  },
  {
    name: 'transition_loop_state',
    description: 'Move a loop from one state to another using the state machine.',
    inputSchema: {
      type: 'object',
      required: ['loop_id', 'to_state'],
      properties: {
        loop_id:  { type: 'string' },
        to_state: { type: 'string', enum: ['waiting', 'due', 'overdue', 'escalated', 'closed'] },
        reason:   { type: 'string', description: 'Why this transition is happening' },
      },
    },
  },
  {
    name: 'draft_followup',
    description: 'Generate a follow-up message draft for a loop. Returns draft text for user approval.',
    inputSchema: {
      type: 'object',
      required: ['loop_id'],
      properties: {
        loop_id: { type: 'string' },
        tone:    { type: 'string', enum: ['friendly', 'firm', 'urgent'], default: 'friendly' },
      },
    },
  },
  {
    name: 'close_loop',
    description: 'Mark a loop as closed (commitment fulfilled or no longer relevant).',
    inputSchema: {
      type: 'object',
      required: ['loop_id'],
      properties: {
        loop_id: { type: 'string' },
        reason:  { type: 'string' },
      },
    },
  },
]

export type McpToolName = typeof MCP_TOOLS[number]['name']
