import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';
import { redactSecrets } from './monitorShared.js';

const inputSchema = z.object({
  id: z.string().describe('The monitor ID (from anakin-monitor-list or anakin-monitor-create)'),
  action: z.enum(['pause', 'resume', 'run_now', 'delete']).describe('What to do with the monitor'),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinMonitorControlTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-monitor-control',
    description:
      '"pause" stops a monitor\'s scheduled checks (POST /monitors/:id/pause), "resume" restarts them ' +
      '(POST /monitors/:id/resume — may hit the plan\'s active-monitor cap), "run_now" triggers an immediate ' +
      'out-of-schedule check billed like a normal check (POST /monitors/:id/run), and "delete" permanently ' +
      'removes the monitor and its history (DELETE /monitors/:id). Every action mutates the monitor (delete ' +
      'irreversibly) — treat this as destructive and do not run it without explicit user intent. Use ' +
      'anakin-monitor-list to find the id.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const base = `/monitors/${encodeURIComponent(input.id)}`;
      let result: Record<string, unknown>;
      switch (input.action) {
        case 'pause':
          result = await client.post(`${base}/pause`);
          break;
        case 'resume':
          result = await client.post(`${base}/resume`);
          break;
        case 'run_now':
          result = await client.post(`${base}/run`);
          break;
        case 'delete':
          result = await client.del(base);
          break;
      }
      return redactSecrets(result) as Record<string, unknown>;
    },
  });
}
