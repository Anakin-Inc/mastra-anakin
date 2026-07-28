import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  prompt: z.string().describe('The search query or research question'),
  limit: z.number().int().positive().max(20).optional().describe('Maximum number of results to return (default 5)'),
});

const outputSchema = z.object({
  id: z.string(),
  results: z.array(
    z.object({
      url: z.string(),
      title: z.string().nullable().optional(),
      snippet: z.string().nullable().optional(),
      date: z.string().nullable().optional(),
      lastUpdated: z.string().nullable().optional(),
    }),
  ),
});

type SearchOutput = z.infer<typeof outputSchema>;

export function createAnakinSearchTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-search',
    description:
      'AI-powered web search. Returns a ranked list of results (url, title, snippet). Synchronous — returns ' +
      'directly, no polling. Costs 3 Anakin credits per call. Calls POST /search.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = {
        prompt: input.prompt,
        limit: input.limit ?? 5,
      };
      return client.post('/search', body) as Promise<SearchOutput>;
    },
  });
}
