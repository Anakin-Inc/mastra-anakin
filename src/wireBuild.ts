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
  actions: z
    .array(z.string())
    .optional()
    .describe(
      'Optional list of discrete capabilities to build, each as its own action (e.g. ["search products", ' +
        '"get product details"]). Omit to let the builder infer them from goal.',
    ),
  country: z
    .string()
    .length(2)
    .optional()
    .describe('Optional 2-letter country code (e.g. "US"); the scraper is built and tested through an exit IP there'),
  credential: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('plain'),
        username: z.string().describe('The account username or email'),
        password: z.string().describe('The account password. Used once by the builder to sign in, never stored.'),
        login_url: z.string().optional().describe("Where the site's login form lives, when it differs from website_url"),
      }),
      z.object({
        type: z.literal('vault'),
        source_id: z.string().describe('The connected identity-source (1Password/Azure) ID'),
        source_ref: z.record(z.string(), z.unknown()).describe('Locator of the entry inside the source'),
        login_url: z.string().optional().describe("Where the site's login form lives, when it differs from website_url"),
      }),
    ])
    .optional()
    .describe(
      'Optional login credential, for building actions behind a sign-in (a login build costs significantly more ' +
        'credits than a public build). Omit for a public build.',
    ),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinWireBuildTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-build',
    description:
      "Request a brand-new Wire action for a website that isn't in the catalog yet. Describe the site " +
      '(website_url) and what the action should do or extract (goal); Wire generates and auto-tests a scraper, ' +
      'then publishes it. Calls POST /wire/build-request. Asynchronous (returns status "pending") and charges ' +
      'credits (login builds cost more), refunded automatically if the build fails. This tool does not poll it to ' +
      'completion; track progress with anakin-wire-build-status. Publishes a new catalog action as a side effect — treat it as destructive and do ' +
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
      if (input.actions?.length) body.actions = input.actions;
      if (input.country) body.country = input.country;
      if (input.credential) body.credential = input.credential;

      return client.post('/wire/build-request', body);
    },
  });
}
