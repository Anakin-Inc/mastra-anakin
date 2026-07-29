import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({});

const outputSchema = z.union([z.array(z.record(z.string(), z.unknown())), z.record(z.string(), z.unknown())]);

export function createAnakinAiVisibilitySourcesTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-ai-visibility-sources',
    description:
      'List the AI answer engines available to anakin-ai-visibility-search — each with its slug (what you pass ' +
      'as `sources`) and display label. Calls GET /ai-visibility/sources. Call this when you need to query a ' +
      'subset of engines or check what is currently enabled.',
    inputSchema,
    outputSchema,
    execute: async () => {
      const client = getAnakinClient(config);
      return client.get('/ai-visibility/sources');
    },
  });
}
