import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  url: z.string().url().describe('The starting URL for discovery (typically a homepage or section root)'),
  limit: z.number().int().min(1).max(1000).optional().describe('Maximum number of URLs to return overall (default 100)'),
  depth: z.number().int().min(1).max(5).optional().describe('How many link-hops from the starting URL to follow (default 2)'),
  limitPerLevel: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe('Maximum URLs collected per depth level, controlling breadth (default 100)'),
  includeSubdomains: z.boolean().optional().describe('Include URLs on subdomains of the starting host (default false)'),
  includeExternalLinks: z.boolean().optional().describe('Also collect, but do not follow, external links (default false)'),
  useBrowser: z.boolean().optional().describe('Render with a headless browser, for SPAs (default false)'),
  search: z.string().optional().describe('Optional keyword filter — only return URLs whose path/title matches'),
});

const outputSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  links: z.array(z.string()),
  totalLinks: z.number(),
  externalLinks: z.array(z.string()),
  totalExternalLinks: z.number(),
  durationMs: z.number().optional(),
  status: z.enum(['completed', 'failed']).optional(),
  error: z.string().nullable().optional(),
});

type MapOutput = z.infer<typeof outputSchema>;

export function createAnakinMapTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-map',
    description:
      "Discover all reachable URLs under a given site — understand a domain's structure before crawling, or find " +
      'the sub-pages an agent should scrape. Returns internal links, external links, and counts, honoring depth ' +
      'and limit parameters. Submits POST /map, then polls GET /map/:jobId until the job completes or fails. Use ' +
      'anakin-crawl instead when you need page content, not just the URL list.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = {
        url: input.url,
        limit: input.limit ?? 100,
        depth: input.depth ?? 2,
        limitPerLevel: input.limitPerLevel ?? 100,
        includeSubdomains: input.includeSubdomains ?? false,
        includeExternalLinks: input.includeExternalLinks ?? false,
        useBrowser: input.useBrowser ?? false,
      };
      if (input.search) body.search = input.search;

      return client.submitAndPoll('/map', '/map', body) as Promise<MapOutput>;
    },
  });
}
