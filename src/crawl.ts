import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  url: z.string().url().describe('The starting URL'),
  maxPages: z.number().int().min(1).max(500).optional().describe('Hard cap on pages fetched (default 10)'),
  depth: z.number().int().min(1).max(5).optional().describe('Link-hops from the starting URL to follow (default 1)'),
  country: z
    .string()
    .regex(/^[a-z]{2}$/i, 'country must be a 2-letter code')
    .optional()
    .describe('2-letter proxy country code (default "us")'),
  useBrowser: z.boolean().optional().describe('Render each page with a headless browser, for SPAs (default false)'),
  includePatterns: z
    .array(z.string())
    .optional()
    .describe('Glob/regex patterns — only URLs matching at least one pattern are fetched'),
  excludePatterns: z.array(z.string()).optional().describe('Glob/regex patterns — URLs matching any pattern are skipped'),
  sessionId: z.string().optional().describe('Reuse an existing authenticated browser session by id'),
  sessionName: z.string().optional().describe('Create or reuse a named browser session'),
});

const crawlPageSchema = z.object({
  url: z.string(),
  status: z.enum(['completed', 'failed']),
  markdown: z.string().nullable().optional(),
  html: z.string().nullable().optional(),
  durationMs: z.number().optional(),
  error: z.string().nullable().optional(),
});

const outputSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  totalPages: z.number(),
  completedPages: z.number(),
  pages: z.array(crawlPageSchema),
  durationMs: z.number().optional(),
  status: z.enum(['completed', 'failed']).optional(),
  error: z.string().nullable().optional(),
});

type CrawlOutput = z.infer<typeof outputSchema>;

export function createAnakinCrawlTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-crawl',
    description:
      'Bulk-fetch markdown across a site — catalog ingestion, site-wide RAG corpus. Pair with includePatterns / ' +
      'excludePatterns to scope which URLs are fetched. Submits POST /crawl, then polls GET /crawl/:jobId until ' +
      'the job completes or fails. Returns an array of pages, each with markdown and per-page status. Use ' +
      'anakin-map first when you only need the URL list, or anakin-url-scraper for a single page.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = {
        url: input.url,
        maxPages: input.maxPages ?? 10,
        depth: input.depth ?? 1,
        country: input.country ?? 'us',
        useBrowser: input.useBrowser ?? false,
      };
      if (input.includePatterns) body.includePatterns = input.includePatterns;
      if (input.excludePatterns) body.excludePatterns = input.excludePatterns;
      if (input.sessionId) body.sessionId = input.sessionId;
      if (input.sessionName) body.sessionName = input.sessionName;

      return client.submitAndPoll('/crawl', '/crawl', body) as Promise<CrawlOutput>;
    },
  });
}
