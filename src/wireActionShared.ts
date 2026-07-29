/**
 * Shared input/output schema and execution path for anakin-wire-read-action
 * and anakin-wire-write-action. Both POST /wire/task with the same body
 * shape; the only difference is which action `type` the tool is meant for
 * (enforced by convention/description, same as Wire's own catalog — the API
 * does not reject a read-typed action_id from the "write" tool or vice
 * versa). Kept as two separate createTool() exports, not one tool with a
 * type parameter, so each has its own honest description instead of one
 * that has to hedge between read-only and destructive framing.
 */
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

export const wireActionInputSchema = z.object({
  action_id: z.string().describe('The action to run (from anakin-wire-discover / anakin-wire-catalog)'),
  params: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "The action's input parameters. Shape depends on the action — use its parameter schema from discovery. " +
        'Omit for actions that take none.',
    ),
  credential_id: z
    .string()
    .optional()
    .describe(
      'Required when the action\'s auth_mode is "required"; honored when "optional"; ignored when "none". Get ' +
        'one from anakin-wire-identities or anakin-wire-login.',
    ),
  identity_id: z
    .string()
    .optional()
    .describe('Optional identity selector — the server resolves a credential from it (alternative to credential_id)'),
});

// WireJobStatus on the wire — status plus either completed data or a failed
// error, with credits_used/execution_ms when known. Indexable because the
// API adds fields per action (Wire's own client.ts types it the same way).
export const wireActionOutputSchema = z
  .object({
    status: z.enum(['processing', 'completed', 'failed']).optional(),
    job_id: z.string().optional(),
    data: z.record(z.string(), z.unknown()).nullable().optional(),
    credits_used: z.number().optional(),
    execution_ms: z.number().optional(),
    error: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .catchall(z.unknown());

export type WireActionOutput = z.infer<typeof wireActionOutputSchema>;

export async function executeWireAction(
  config: AnakinClientOptions | undefined,
  input: z.infer<typeof wireActionInputSchema>,
): Promise<WireActionOutput> {
  const client = getAnakinClient(config);
  const body: Record<string, unknown> = { action_id: input.action_id };
  if (input.params && Object.keys(input.params).length > 0) body.params = input.params;
  if (input.credential_id) body.credential_id = input.credential_id;
  if (input.identity_id) body.identity_id = input.identity_id;

  const accepted = await client.post('/wire/task', body);
  const jobId = accepted['job_id'];
  if (typeof jobId !== 'string' || !jobId) {
    // Sync action: terminal data came back inline, no job to poll.
    return accepted as WireActionOutput;
  }

  const result = await client.pollUntil(
    `/wire/jobs/${encodeURIComponent(jobId)}`,
    body => body.status === 'completed' || body.status === 'failed',
  );
  if (result.status === 'failed') {
    const err = result.error as Record<string, unknown> | undefined;
    const message = (typeof err?.message === 'string' && err.message) || (typeof err?.code === 'string' && err.code) || 'unknown';
    throw new Error(`Wire job failed: ${message}`);
  }
  return result as WireActionOutput;
}
