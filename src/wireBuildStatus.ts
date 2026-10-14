import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient, withQuery } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  id: z
    .string()
    .min(1)
    .optional()
    .describe("A build request id (from anakin-wire-build's build_request). Omit to list recent builds."),
  status: z
    .string()
    .optional()
    .describe('List mode only — filter by status (e.g. "pending", "processing", "success", "failed")'),
  limit: z.number().int().min(1).max(100).optional().describe('List mode only — builds per page (default 10)'),
  page: z.number().int().min(1).optional().describe('List mode only — 1-based page number'),
  include_events: z
    .boolean()
    .optional()
    .describe("Detail mode only — include the build's step-by-step event log (verbose; default false)"),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinWireBuildStatusTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-build-status',
    description:
      "Check on Wire builds started with anakin-wire-build. Pass the `id` from anakin-wire-build's build_request " +
      'to get that build\'s detail: its status ("pending"/"processing" means still running, check again after ' +
      '~30s), the published actions (each with the action_id to run via anakin-wire-read-action / ' +
      'anakin-wire-write-action), the `skipped` list (capabilities the build could not deliver; delivery may be ' +
      'partial), and the catalog_slug once an action has published. Omit `id` to list your recent build requests, ' +
      'optionally filtered by `status`. Calls GET /wire/build-requests/:id or GET /wire/build-requests. ' +
      'Read-only; spends no credits.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      if (input.id) {
        const result = await client.get(`/wire/build-requests/${encodeURIComponent(input.id)}`);
        if (input.include_events !== true && 'events' in result) {
          const { events: _events, ...rest } = result;
          return rest;
        }
        return result;
      }
      return client.get(
        withQuery('/wire/build-requests', { status: input.status, limit: input.limit ?? 10, page: input.page }),
      );
    },
  });
}
