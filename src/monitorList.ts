import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';
import { redactSecrets } from './monitorShared.js';

const inputSchema = z.object({
  id: z.string().optional().describe('Monitor ID — fetch just this monitor instead of the full list'),
});

const outputSchema = z.union([z.array(z.record(z.string(), z.unknown())), z.record(z.string(), z.unknown())]);
type MonitorListOutput = z.infer<typeof outputSchema>;

export function createAnakinMonitorListTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-monitor-list',
    description:
      "List your website monitors (GET /monitors), or pass `id` to fetch one monitor's full configuration and " +
      'status (GET /monitors/:id) — next/last check time, active state, per-check credit cost, alert settings. ' +
      'Use this to find a monitor\'s id before anakin-monitor-changes or anakin-monitor-control. Each monitor\'s ' +
      'alertWebhookSecret is redacted; view it in the Anakin dashboard.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const result = input.id ? await client.get(`/monitors/${encodeURIComponent(input.id)}`) : await client.get('/monitors');
      return redactSecrets(result) as MonitorListOutput;
    },
  });
}
