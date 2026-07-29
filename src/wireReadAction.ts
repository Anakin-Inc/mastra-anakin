import { createTool } from '@mastra/core/tools';

import type { AnakinClientOptions } from './client.js';
import { executeWireAction, wireActionInputSchema, wireActionOutputSchema } from './wireActionShared.js';

export function createAnakinWireReadActionTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-wire-read-action',
    description:
      'Run a Wire READ action — one whose type is "read" (it EXTRACTS data and does not change state on the ' +
      'target site): search listings, fetch a category\'s products, get a product\'s price/specs/reviews, read a ' +
      'profile, pull dashboard metrics. Discover action_ids first with anakin-wire-discover or anakin-wire-catalog ' +
      'and confirm the action\'s type is "read"; `params` must match that action\'s parameter schema. Submits ' +
      'POST /wire/task; when the response carries a job_id this transparently polls GET /wire/jobs/:jobId to ' +
      'completion, otherwise the (sync) result is returned inline. Most read actions need no auth; if the ' +
      'action\'s auth_mode is "required" pass a credential_id from anakin-wire-identities or anakin-wire-login. ' +
      'For state-changing actions (type "write") use anakin-wire-write-action instead.',
    inputSchema: wireActionInputSchema,
    outputSchema: wireActionOutputSchema,
    execute: async input => executeWireAction(config, input),
  });
}
