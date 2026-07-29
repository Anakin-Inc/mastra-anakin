import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  slug: z
    .string()
    .optional()
    .describe('Catalog slug to inspect (e.g. "walmart", "amazon", "linkedin"). Omit to list all catalogs.'),
});

// The shape returned genuinely differs between "list every catalog" and "one
// catalog's full action list with parameter schemas" — left as a passthrough
// record rather than fabricating a single shared shape.
const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinWireCatalogTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-catalog',
    description:
      'Browse the Wire catalog. With no arguments, lists every supported website and its action count. Pass a ' +
      'catalog `slug` (e.g. "walmart", "amazon", "linkedin") to get that site\'s full action list with exact ' +
      'parameter schemas, each action\'s type (read/write), auth mode (none/optional/required), and credit cost — ' +
      'plus the login fields for credentials-mode sites. Calls GET /wire/catalog or GET /wire/catalog/:slug. Use ' +
      'this to see everything a specific site can do before running an action with anakin-wire-read-action or ' +
      'anakin-wire-write-action.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const path = input.slug ? `/wire/catalog/${encodeURIComponent(input.slug)}` : '/wire/catalog';
      return client.get(path);
    },
  });
}
