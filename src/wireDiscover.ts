import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient, withQuery } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  q: z
    .string()
    .describe(
      'The intent in natural language, e.g. "top phones on walmart", "search airbnb listings in Lisbon", ' +
        '"a linkedin profile\'s work history"',
    ),
  limit: z.number().int().positive().optional().describe('Maximum number of candidate actions to return (default 5)'),
});

const outputSchema = z.object({
  results: z.array(z.record(z.string(), z.unknown())).optional(),
  next: z.string().optional(),
});

type WireDiscoverOutput = z.infer<typeof outputSchema>;

export function createAnakinWireDiscoverTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-discover',
    description:
      'Find Wire actions for a task from a natural-language intent. Wire is a catalog of pre-built automation ' +
      'actions across hundreds of websites (Amazon, Walmart, LinkedIn, Airbnb, Zillow, and others). Actions are ' +
      'of two kinds: READ actions that extract data (search listings, fetch a category\'s products, get a ' +
      'product\'s price/specs/reviews, read a profile, pull dashboard metrics) and WRITE actions that perform ' +
      'interactions (log in, submit a form). Many read actions need no authentication. Calls ' +
      'GET /wire/resolve?q=&limit=. Returns ranked candidate actions, each with its action_id, type ("read" or ' +
      '"write"), required/optional params, credit cost, and whether auth is needed. Run a returned action with ' +
      'anakin-wire-read-action (type "read") or anakin-wire-write-action (type "write").',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const path = withQuery('/wire/resolve', { q: input.q, limit: input.limit });
      return client.get(path) as Promise<WireDiscoverOutput>;
    },
  });
}
