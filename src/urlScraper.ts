import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  url: z.string().url().describe('The URL to scrape'),
  country: z
    .string()
    .regex(/^[a-z]{2}$/i, 'country must be a 2-letter code')
    .optional()
    .describe('2-letter proxy country code (default "us")'),
  useBrowser: z.boolean().optional().describe('Render with a headless browser for JS-heavy pages (default false)'),
  generateJson: z.boolean().optional().describe('Also generate structured JSON from the page (default false)'),
  forceFresh: z.boolean().optional().describe('Bypass the cache and force a fresh scrape (default false)'),
  sessionId: z.string().optional().describe('Reuse an existing authenticated browser session by id'),
  sessionName: z.string().optional().describe('Create or reuse a named browser session'),
});

const outputSchema = z.object({
  id: z.string(),
  url: z.string(),
  status: z.enum(['completed', 'failed']),
  cached: z.boolean().optional(),
  durationMs: z.number().optional(),
  markdown: z.string().nullable().optional(),
  html: z.string().nullable().optional(),
  cleanedHtml: z.string().nullable().optional(),
  links: z.array(z.string()).nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  summary: z.string().nullable().optional(),
  generatedJson: z.record(z.string(), z.any()).nullable().optional(),
  screenshotUrl: z.string().nullable().optional(),
  fullPageScreenshotUrl: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

type UrlScraperOutput = z.infer<typeof outputSchema>;

export function createAnakinUrlScraperTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-url-scraper',
    description:
      'Scrape a single URL and return its content as Markdown (plus optionally HTML, links, images, or ' +
      'AI-generated structured JSON). Submits POST /url-scraper, then polls GET /url-scraper/:jobId until the ' +
      'job completes or fails. Use this for single pages; for AI-directed multi-page research use ' +
      'anakin-agentic-search instead.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = {
        url: input.url,
        country: input.country ?? 'us',
        useBrowser: input.useBrowser ?? false,
        generateJson: input.generateJson ?? false,
        forceFresh: input.forceFresh ?? false,
      };
      if (input.sessionId) body.sessionId = input.sessionId;
      if (input.sessionName) body.sessionName = input.sessionName;

      return client.submitAndPoll('/url-scraper', '/url-scraper', body) as Promise<UrlScraperOutput>;
    },
  });
}
