import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient, withQuery } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  catalog_id: z.string().optional().describe('Optional — restrict to identities for a single catalog'),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinWireIdentitiesTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-identities',
    description:
      'List your saved Wire identities and their credentials. An identity is a named account on a site; each ' +
      'credential\'s `id` is the `credential_id` you pass to anakin-wire-read-action / anakin-wire-write-action to ' +
      'run actions whose auth_mode is "required". Optionally filter by catalog_id. Calls ' +
      'GET /wire/identities?catalog_id=. Use this to find an existing credential before running an auth-required ' +
      'action (and check its status is "active", not "expired").',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const path = withQuery('/wire/identities', { catalog_id: input.catalog_id });
      return client.get(path);
    },
  });
}
