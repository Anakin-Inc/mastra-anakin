import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';
import { redactSecrets } from './monitorShared.js';

const inputSchema = z.object({
  id: z.string().describe('The monitor ID (from anakin-monitor-list or anakin-monitor-create)'),
});

const outputSchema = z.union([z.array(z.record(z.string(), z.unknown())), z.record(z.string(), z.unknown())]);
type MonitorChangesOutput = z.infer<typeof outputSchema>;

export function createAnakinMonitorChangesTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-monitor-changes',
    description:
      'Get the detected changes for a monitor — each entry records when the watched content differed from the ' +
      'previous check, with a diff/summary (and the AI change summary when aiMode is on). Calls ' +
      'GET /monitors/:id/changes. Use anakin-monitor-list first to find the monitor id.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const result = await client.get(`/monitors/${encodeURIComponent(input.id)}/changes`);
      return redactSecrets(result) as MonitorChangesOutput;
    },
  });
}
