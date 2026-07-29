import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  catalog_slug: z.string().describe('The catalog to sign in to (e.g. "neb")'),
  params: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Login fields defined by the catalog (e.g. { email, password }). Use anakin-wire-catalog's " +
        'login_input_schema to learn the field names.',
    ),
  identity_name: z
    .string()
    .optional()
    .describe('Optional name for the identity. Derived from params in password mode; required when using a 1Password locator.'),
  source_id: z.string().optional().describe('Optional 1Password identity-source ID (alternative to params)'),
  source_ref: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Optional 1Password item locator { vault_id, item_id, fields } (use with source_id instead of params)'),
});

const outputSchema = z.record(z.string(), z.unknown());

export function createAnakinWireLoginTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-login',
    description:
      'Sign in to a credentials-mode Wire site and get a credential_id usable immediately with ' +
      'anakin-wire-read-action / anakin-wire-write-action. Provide the catalog `slug` and login `params` (the ' +
      'fields that catalog\'s login schema defines, e.g. email/password — see anakin-wire-catalog\'s ' +
      'login_input_schema). Calls POST /wire/login. The password is never stored, only the encrypted session. ' +
      'This establishes and stores an authenticated session on a real external site — treat it as destructive and ' +
      'do not run it without explicit user intent. Only needed for actions whose auth_mode is "required", and ' +
      'only for catalogs that support password sign-in; cookie-based sites use the dashboard connect flow instead.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = { catalog_slug: input.catalog_slug };
      if (input.params) body.params = input.params;
      if (input.identity_name) body.identity_name = input.identity_name;
      if (input.source_id) body.source_id = input.source_id;
      if (input.source_ref) body.source_ref = input.source_ref;

      return client.post('/wire/login', body);
    },
  });
}
