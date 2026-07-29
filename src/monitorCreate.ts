import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';
import { redactSecrets } from './monitorShared.js';

const inputSchema = z.object({
  url: z.string().url().describe("The URL to watch (root URL for site scope; the Wire site's URL for wire scope)"),
  intervalMinutes: z.number().int().min(15).describe('Check frequency in minutes. Minimum 15.'),
  scope: z
    .enum(['page', 'site', 'wire'])
    .optional()
    .describe('What to monitor: one page (default), a whole site, or a Wire action'),
  watchMode: z
    .enum(['full_page', 'specific_data'])
    .optional()
    .describe('Compare the whole page (default) or only the fields in outputSchema, extracted with AI'),
  watchFormat: z
    .enum(['markdown', 'html', 'cleaned_html'])
    .optional()
    .describe('Format compared in full_page mode (default "markdown")'),
  outputSchema: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('JSON Schema of the fields to track. Required when watchMode is "specific_data".'),
  aiMode: z
    .boolean()
    .optional()
    .describe(
      'AI meaningful-change filtering: ignores trivial noise (ads, timestamps) and summarizes real changes. ' +
        '+1 credit per check.',
    ),
  aiGoal: z
    .string()
    .optional()
    .describe(
      'Natural-language description of which changes count as meaningful (used with aiMode), e.g. "only when ' +
        'the price drops or it goes out of stock"',
    ),
  useBrowser: z
    .boolean()
    .optional()
    .describe('Render checks with a stealth headless browser. Forced true when sessionId is set.'),
  country: z.string().optional().describe('2-letter proxy country code (default "us")'),
  sessionId: z.string().optional().describe('Saved browser-session ID for monitoring login-protected pages'),
  isActive: z.boolean().optional().describe('Start running immediately (default true)'),
  expiresAt: z
    .string()
    .optional()
    .describe('Optional end date (ISO 8601 timestamp or YYYY-MM-DD); the monitor auto-pauses when it passes'),
  alertWebhookUrl: z.string().optional().describe('Webhook URL that receives signed change alerts'),
  alertEmails: z.string().optional().describe('Comma-separated email recipients for change alerts'),
  maxPages: z.number().int().min(1).optional().describe('Site scope: max pages crawled per run'),
  maxDepth: z.number().int().min(1).max(5).optional().describe('Site scope: crawl depth (default 2)'),
  includePatterns: z
    .array(z.string())
    .optional()
    .describe('Site scope: glob patterns or hand-picked same-site URLs to track'),
  excludePatterns: z.array(z.string()).optional().describe('Site scope: glob patterns to skip'),
  wireActionId: z
    .string()
    .optional()
    .describe('Wire scope (required there): the Wire action run each check, e.g. "amazon.search_products"'),
  wireCatalogSlug: z.string().optional().describe('Wire scope: catalog slug of the Wire site'),
  wireCredentialId: z.string().optional().describe('Wire scope: credential ID when the action needs auth'),
  wireParams: z.record(z.string(), z.unknown()).optional().describe('Wire scope: parameters passed to the action each check'),
  wireWatchPaths: z.array(z.string()).optional().describe('Wire scope: JSON paths to diff instead of the whole response'),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinMonitorCreateTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-monitor-create',
    description:
      'Create a scheduled website monitor that checks a URL every intervalMinutes (min 15) and records a change ' +
      'when the content differs — optionally alerting a webhook or email. scope "page" (default) watches one URL; ' +
      '"site" crawls the site each run and tracks pages added/removed/changed; "wire" runs a Wire action each ' +
      'check and diffs its JSON. watchMode "full_page" (2 credits/check) compares the whole page; ' +
      '"specific_data" (3 credits/check) extracts only the fields in outputSchema with AI — ideal for ' +
      'price/stock/status tracking. Calls POST /monitors. Creates a recurring, credit-billed job — treat it as ' +
      'destructive and do not run it without explicit user intent. Active-monitor caps per plan: Free 5, Pro 20, ' +
      'Scale 100. The response\'s alertWebhookSecret is redacted; view it in the Anakin dashboard.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const { url, intervalMinutes, ...rest } = input;
      const body: Record<string, unknown> = { url, intervalMinutes };
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) body[key] = value;
      }

      const monitor = await client.post('/monitors', body);
      return redactSecrets(monitor) as Record<string, unknown>;
    },
  });
}
