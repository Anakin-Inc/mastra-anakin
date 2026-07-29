import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  query: z.string().max(2000).describe('The question to ask every engine (max 2000 characters)'),
  sources: z
    .array(z.string())
    .optional()
    .describe('Engine slugs to query (see anakin-ai-visibility-sources). Omit to query all enabled engines.'),
  country: z.string().optional().describe('2-letter ISO country for the search geography, proxy exit (default "us")'),
  includeFullContent: z
    .boolean()
    .optional()
    .describe(
      "Include each engine's raw full answer in the results (large). Defaults to false — summaries and the " +
        'synthesis are returned regardless.',
    ),
});

const outputSchema = z.object({
  search_id: z.string(),
  status: z.string(),
  country: z.string().optional(),
  synthesis: z.string().optional(),
  results: z.array(z.record(z.string(), z.unknown())),
});

type AIVisibilitySearchOutput = z.infer<typeof outputSchema>;

export function createAnakinAiVisibilitySearchTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-ai-visibility-search',
    description:
      'Ask multiple AI answer engines (ChatGPT, Gemini, Google AI Overview) the same question and compare their ' +
      'answers. Returns one result per engine — status, an answer summary, latency, credits used, and a ' +
      'consensus/outlier verdict — plus an AI-generated synthesis of where the engines agree and diverge. Submits ' +
      'POST /ai-visibility/search, then polls GET /ai-visibility/search/:search_id until the status is no longer ' +
      '"running" — typically 1-2 minutes; a "failed" run still returns whichever per-source results did come back, ' +
      'it does not throw. Use for brand/AI-SEO visibility checks ("what do AI engines say about X"), answer ' +
      'comparison, and geo-specific AI answers (set country). Billed per source at that engine\'s rate; failed ' +
      'sources are free. Set includeFullContent: true only when you need each engine\'s raw full answer — it is ' +
      'large.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = { query: input.query };
      if (input.sources) body.sources = input.sources;
      if (input.country) body.country = input.country;

      const submitted = await client.post('/ai-visibility/search', body);
      const searchId = submitted['search_id'];
      if (typeof searchId !== 'string' || !searchId) {
        throw new Error(`Anakin AI visibility search response did not include a search_id: ${JSON.stringify(submitted)}`);
      }

      const search = await client.pollUntil(
        `/ai-visibility/search/${encodeURIComponent(searchId)}`,
        body => body.status !== 'running',
      );

      const rawResults = Array.isArray(search['results']) ? (search['results'] as Record<string, unknown>[]) : [];
      const results = input.includeFullContent
        ? rawResults
        : rawResults.map(r => {
            const { full_content: _dropped, ...rest } = r;
            return rest;
          });

      return {
        search_id: searchId,
        status: String(search['status']),
        country: typeof search['country'] === 'string' ? (search['country'] as string) : undefined,
        synthesis: typeof search['synthesis'] === 'string' ? (search['synthesis'] as string) : undefined,
        results,
      } satisfies AIVisibilitySearchOutput;
    },
  });
}
