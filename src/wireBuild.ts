import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  website_url: z.string().url().describe('The site to build an action for. The domain is extracted automatically.'),
  goal: z
    .string()
    .describe(
      'Natural-language description of what the action should do or extract. Be specific — the builder ' +
        'synthesizes the scraper from this.',
    ),
  catalog_id: z.string().optional().describe('Optional — attach to an existing catalog instead of creating one'),
  visibility: z.enum(['private', 'public']).optional().describe('Action visibility (default "private")'),
  force: z
    .boolean()
    .optional()
    .describe('Build even if similar actions already exist for the domain (otherwise rejected with ACTION_EXISTS)'),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinWireBuildTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-build',
    description:
      "Request a brand-new Wire action for a website that isn't in the catalog yet. Describe the site " +
      '(website_url) and what the action should do or extract (goal); Wire generates and auto-tests a scraper, ' +
      'then publishes it. Calls POST /wire/build-request. Asynchronous (returns status "pending") and charges ' +
      'credits, refunded automatically if the build fails — this tool does not poll it to completion, check back ' +
      'via anakin-wire-catalog. Publishes a new catalog action as a side effect — treat it as destructive and do ' +
      'not run it without explicit user intent. Only use this after anakin-wire-discover / anakin-wire-catalog ' +
      'confirm no existing action covers the site.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = { website_url: input.website_url, goal: input.goal };
      if (input.catalog_id) body.catalog_id = input.catalog_id;
      if (input.visibility) body.visibility = input.visibility;
      if (input.force !== undefined) body.force = input.force;

      return client.post('/wire/build-request', body);
    },
  });
}
