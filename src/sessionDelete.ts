import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  id: z.string().describe('The session ID to delete (from anakin-session-list)'),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinSessionDeleteTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-session-delete',
    description:
      'Permanently delete a saved browser session and its encrypted login data. Calls DELETE /sessions/:id. ' +
      'Irreversible — the user must log in again through the Anakin dashboard to recreate it, and any monitors or ' +
      'requests referencing this sessionId will lose authenticated access. Treat this as destructive and do not ' +
      'run it without explicit user intent. Find ids with anakin-session-list.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      return client.del(`/sessions/${encodeURIComponent(input.id)}`);
    },
  });
}
