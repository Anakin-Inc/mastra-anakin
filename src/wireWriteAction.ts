import { createTool } from '@mastra/core/tools';

import type { AnakinClientOptions } from './client.js';
import { executeWireAction, wireActionInputSchema, wireActionOutputSchema } from './wireActionShared.js';

export function createAnakinWireWriteActionTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-write-action',
    description:
      'Run a Wire WRITE action — one whose type is "write" (it performs a state-changing interaction on the ' +
      'target site): submit a form, add an item to a cart, post or send content, update account settings. ' +
      'Discover action_ids first with anakin-wire-discover or anakin-wire-catalog and confirm the action\'s type ' +
      'is "write"; `params` must match that action\'s parameter schema. Most write actions need auth — pass a ' +
      'credential_id from anakin-wire-identities or anakin-wire-login. Submits POST /wire/task; when the response ' +
      'carries a job_id this transparently polls GET /wire/jobs/:jobId to completion, otherwise the (sync) result ' +
      'is returned inline. This is a side-effecting call on a real external site — treat it as destructive and do ' +
      'not run it without explicit user intent. For data extraction that does not change state (type "read") use ' +
      'anakin-wire-read-action instead.',
    inputSchema: wireActionInputSchema,
    outputSchema: wireActionOutputSchema,
    execute: async input => executeWireAction(config, input),
  });
}
