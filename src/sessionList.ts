import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient, withQuery } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  domain: z.string().optional().describe('Filter to sessions for one website domain, e.g. "amazon.com"'),
});

const outputSchema = z.union([z.array(z.record(z.string(), z.unknown())), z.record(z.string(), z.unknown())]);

export function createAnakinSessionListTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-session-list',
    description:
      'List your saved browser sessions — encrypted login states captured via the Anakin dashboard or Browser ' +
      "API. Each session's id is what you pass as sessionId to anakin-url-scraper / anakin-crawl, " +
      'anakin-monitor-create, or session_id to anakin-browser-task, to work with login-protected pages. Optionally filter ' +
      'by the website domain the session belongs to. Calls GET /sessions?domain=. If no session exists for a ' +
      'site, the user must create one interactively in the Anakin dashboard (log in once; 2FA/captchas included) ' +
      '— that flow cannot run from this tool.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const path = withQuery('/sessions', { domain: input.domain });
      return client.get(path);
    },
  });
}
